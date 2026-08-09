import {
  getMatchdaySnapshot,
  type MatchdaySnapshot,
} from "@footballleagues/core/home";
import { LEAGUE_GROUPS, type LeagueKey } from "@footballleagues/core/leagues";
import {
  getLiveSchedule,
  type LiveScheduleResult,
} from "@footballleagues/core/live";
import { OPENLIGADB_CACHE_SECONDS } from "@footballleagues/core/openligadb";
import { getCompetitionMeta } from "@/features/football/competition-meta";
import {
  getPollingScopes,
  type LiveMatchItem,
  type LiveMatchScope,
  mergeMatchdayPayload,
} from "../components/live-polling";

const MATCHDAY_REFRESH_CONCURRENCY = 3;
const OPENLIGADB_UNAVAILABLE_ERROR = "OpenLigaDB ist gerade nicht verfügbar";
const PARTIAL_SCHEDULE_ERROR =
  "Spielpläne einzelner Wettbewerbe sind gerade nicht verfügbar";
const PARTIAL_SCORE_ERROR =
  "Einige Live-Spielstände sind gerade nicht verfügbar";

type LoadLiveSchedule = () => Promise<LiveScheduleResult>;
type LoadMatchday = (params: {
  group: number;
  league: LeagueKey;
  season: string;
}) => Promise<MatchdaySnapshot>;

export type LivePageData = {
  checkedAt: number;
  failedLeagues: LeagueKey[];
  matches: LiveMatchItem[];
  visibleErrors: string[];
};

export type LivePageDataDependencies = {
  loadMatchday?: LoadMatchday;
  loadSchedule?: LoadLiveSchedule;
  now?: () => number;
};

export type LiveDiscoveryDependencies = Pick<
  LivePageDataDependencies,
  "loadSchedule" | "now"
>;

type MatchdayRefreshOutcome =
  | {
      payload: MatchdaySnapshot;
      scope: LiveMatchScope;
      status: "fulfilled";
    }
  | {
      reason: unknown;
      scope: LiveMatchScope;
      status: "rejected";
    };

const loadCurrentMatchday: LoadMatchday = (params) =>
  getMatchdaySnapshot(params, {
    requestOptions: {
      next: { revalidate: OPENLIGADB_CACHE_SECONDS.liveMatchday },
    },
  });

const isValidGroup = (value: number | undefined): value is number =>
  Number.isInteger(value) && (value ?? 0) > 0;

const toLiveMatchItem = ({
  league,
  match,
  season,
}: LiveScheduleResult["matches"][number]): LiveMatchItem => {
  const meta = getCompetitionMeta(league);
  const group = match.group?.groupOrderID;
  const groupName = match.group?.groupName?.trim();

  return {
    competitionId: league,
    competitionLabel: meta.label,
    match,
    roundLabel: groupName || `Saison ${season}`,
    scope: isValidGroup(group)
      ? {
          group,
          league,
          season,
        }
      : undefined,
  };
};

const refreshMatchdays = async (
  scopes: readonly LiveMatchScope[],
  loadMatchday: LoadMatchday,
): Promise<MatchdayRefreshOutcome[]> => {
  const outcomes: Array<MatchdayRefreshOutcome | undefined> = new Array(
    scopes.length,
  );
  let nextIndex = 0;

  const worker = async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= scopes.length) return;

      const scope = scopes[index]!;

      try {
        outcomes[index] = {
          payload: await loadMatchday({
            group: scope.group,
            league: scope.league,
            season: String(scope.season),
          }),
          scope,
          status: "fulfilled",
        };
      } catch (reason) {
        outcomes[index] = {
          reason,
          scope,
          status: "rejected",
        };
      }
    }
  };

  await Promise.all(
    Array.from(
      {
        length: Math.min(MATCHDAY_REFRESH_CONCURRENCY, scopes.length),
      },
      worker,
    ),
  );

  return outcomes.filter(
    (outcome): outcome is MatchdayRefreshOutcome => outcome !== undefined,
  );
};

const isTotalDiscoveryFailure = (schedule: LiveScheduleResult) =>
  schedule.matches.length === 0 &&
  new Set(schedule.failedLeagues).size >= LEAGUE_GROUPS.length;

export const getLiveDiscoveryData = async ({
  loadSchedule = getLiveSchedule,
  now = Date.now,
}: LiveDiscoveryDependencies = {}): Promise<LivePageData> => {
  let schedule: LiveScheduleResult;

  try {
    schedule = await loadSchedule();
  } catch (error) {
    console.warn("[OpenLigaDB] live schedule discovery failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      event: "live_schedule_failed",
    });

    return {
      checkedAt: now(),
      failedLeagues: LEAGUE_GROUPS.map(({ key }) => key),
      matches: [],
      visibleErrors: [OPENLIGADB_UNAVAILABLE_ERROR],
    };
  }

  if (isTotalDiscoveryFailure(schedule)) {
    return {
      checkedAt: schedule.checkedAt,
      failedLeagues: schedule.failedLeagues,
      matches: [],
      visibleErrors: [OPENLIGADB_UNAVAILABLE_ERROR],
    };
  }

  return {
    checkedAt: schedule.checkedAt,
    failedLeagues: schedule.failedLeagues,
    matches: schedule.matches.map(toLiveMatchItem),
    visibleErrors:
      schedule.failedLeagues.length > 0 ? [PARTIAL_SCHEDULE_ERROR] : [],
  };
};

export const getLivePageData = async ({
  loadMatchday = loadCurrentMatchday,
  loadSchedule = getLiveSchedule,
  now = Date.now,
}: LivePageDataDependencies = {}): Promise<LivePageData> => {
  const discovery = await getLiveDiscoveryData({ loadSchedule, now });
  let matches = discovery.matches;
  const visibleErrors = [...discovery.visibleErrors];
  const scopes = getPollingScopes(matches, new Date(now()));
  const outcomes = await refreshMatchdays(scopes, loadMatchday);
  let checkedAt = discovery.checkedAt;
  let refreshFailed = false;

  for (const outcome of outcomes) {
    if (outcome.status === "rejected") {
      refreshFailed = true;
      continue;
    }

    matches = mergeMatchdayPayload(matches, outcome.payload);
    checkedAt = Math.max(checkedAt, outcome.payload.checkedAt);
  }

  if (refreshFailed) visibleErrors.push(PARTIAL_SCORE_ERROR);

  return {
    checkedAt,
    failedLeagues: discovery.failedLeagues,
    matches,
    visibleErrors,
  };
};
