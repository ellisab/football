import {
  buildLeagueEntriesByGroup,
  getCurrentSeasonYear,
  getDataShortcutForLeague,
  LEAGUE_GROUPS,
  type LeagueKey,
  pickLeagueEntryForSeason,
  resolveEffectiveLeagueShortcut,
} from "../leagues";
import { getMatchKickoffTimestamp } from "../matches";
import {
  type ApiLeague,
  type ApiMatch,
  getAllMatches,
  getAvailableLeaguesBySeason,
  OPENLIGADB_CACHE_SECONDS,
} from "../openligadb";
import type {
  GetLiveScheduleOptions,
  LiveDataSource,
  LiveScheduleMatch,
  LiveScheduleResult,
} from "./types";

const LIVE_LOOKBACK_MS = 6 * 60 * 60 * 1_000;
const LIVE_SCHEDULE_CONCURRENCY = 3;
const LIVE_SCHEDULE_REQUEST_TIMEOUT_MS = 6_000;
const UPCOMING_MATCH_LIMIT = 5;

type CompetitionRequest = {
  league: LeagueKey;
  season: number;
  effectiveShortcut: string;
};

type CompetitionLoadResult =
  | {
      request: CompetitionRequest;
      status: "fulfilled";
      matches: ApiMatch[];
    }
  | {
      request: CompetitionRequest;
      status: "rejected";
    };

type TimedLiveScheduleMatch = LiveScheduleMatch & {
  kickoffTimestamp: number;
};

export const openLigaDbLiveDataSource: LiveDataSource = {
  getAvailableLeaguesBySeason,
  getAllMatches,
};

const runWithTimeout = async <T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> => {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      const error = new Error(
        `Live schedule request timed out after ${timeoutMs}ms`,
      );
      error.name = "TimeoutError";
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      timeoutPromise,
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
};

const resolveCompetitionRequests = ({
  availableLeagues,
  season,
}: {
  availableLeagues: ApiLeague[];
  season: number;
}): CompetitionRequest[] => {
  const entriesByLeague = buildLeagueEntriesByGroup(availableLeagues);

  return LEAGUE_GROUPS.map(({ key: league }) => {
    const entry = pickLeagueEntryForSeason(
      entriesByLeague.get(league) ?? [],
      season,
    );
    const fallbackShortcut = getDataShortcutForLeague(league);

    return {
      league,
      season,
      effectiveShortcut: resolveEffectiveLeagueShortcut(
        league,
        entry?.leagueShortcut ?? fallbackShortcut,
      ),
    };
  });
};

const loadCompetitionSchedules = async ({
  dataSource,
  requests,
  requestTimeoutMs,
}: {
  dataSource: LiveDataSource;
  requests: CompetitionRequest[];
  requestTimeoutMs: number;
}): Promise<CompetitionLoadResult[]> => {
  const results: Array<CompetitionLoadResult | undefined> = new Array(
    requests.length,
  );
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < requests.length) {
      const index = nextIndex;
      nextIndex += 1;
      const request = requests[index] as CompetitionRequest;

      try {
        const matches = await runWithTimeout(
          (signal) =>
            dataSource.getAllMatches(
              request.effectiveShortcut,
              request.season,
              {
                signal,
                next: {
                  revalidate: OPENLIGADB_CACHE_SECONDS.liveSchedule,
                },
              },
            ),
          requestTimeoutMs,
        );

        if (!Array.isArray(matches)) {
          throw new TypeError("Live schedule response must be an array");
        }

        results[index] = {
          request,
          status: "fulfilled",
          matches,
        };
      } catch {
        results[index] = {
          request,
          status: "rejected",
        };
      }
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(LIVE_SCHEDULE_CONCURRENCY, requests.length) },
      worker,
    ),
  );

  return results.filter(
    (result): result is CompetitionLoadResult => result !== undefined,
  );
};

const compareStrings = (left: string, right: string) => {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
};

const getComparableMatchId = (match: ApiMatch) => {
  return typeof match.matchID === "number" && Number.isFinite(match.matchID)
    ? match.matchID
    : Number.MAX_SAFE_INTEGER;
};

const getLeagueOrder = (league: LeagueKey) => {
  return LEAGUE_GROUPS.findIndex((group) => group.key === league);
};

const getFallbackMatchKey = ({
  league,
  season,
  effectiveShortcut,
  match,
}: LiveScheduleMatch) => {
  return [
    league,
    season,
    effectiveShortcut,
    match.matchDateTimeUTC ?? match.matchDateTime ?? "",
    match.group?.groupOrderID ?? "",
    match.team1?.teamId ?? match.team1?.teamName ?? "",
    match.team2?.teamId ?? match.team2?.teamName ?? "",
  ].join(":");
};

const getMatchKey = (candidate: LiveScheduleMatch) => {
  return typeof candidate.match.matchID === "number" &&
    Number.isFinite(candidate.match.matchID)
    ? `${candidate.league}:id:${candidate.match.matchID}`
    : `fallback:${getFallbackMatchKey(candidate)}`;
};

const compareCandidates = (
  left: TimedLiveScheduleMatch,
  right: TimedLiveScheduleMatch,
) => {
  const byKickoff = left.kickoffTimestamp - right.kickoffTimestamp;
  if (byKickoff !== 0) return byKickoff;

  const byMatchId =
    getComparableMatchId(left.match) - getComparableMatchId(right.match);
  if (byMatchId !== 0) return byMatchId;

  const byLeague = getLeagueOrder(left.league) - getLeagueOrder(right.league);
  if (byLeague !== 0) return byLeague;

  const byShortcut = compareStrings(
    left.effectiveShortcut,
    right.effectiveShortcut,
  );
  if (byShortcut !== 0) return byShortcut;

  return compareStrings(getFallbackMatchKey(left), getFallbackMatchKey(right));
};

const selectScheduleMatches = ({
  results,
  nowTimestamp,
}: {
  results: CompetitionLoadResult[];
  nowTimestamp: number;
}): LiveScheduleMatch[] => {
  const candidates: TimedLiveScheduleMatch[] = [];

  for (const result of results) {
    if (result.status === "rejected") continue;

    for (const match of result.matches) {
      if (match.matchIsFinished === true) continue;

      const kickoffTimestamp = getMatchKickoffTimestamp(match);
      if (kickoffTimestamp === null) continue;

      candidates.push({
        ...result.request,
        match,
        kickoffTimestamp,
      });
    }
  }

  candidates.sort(compareCandidates);

  const uniqueCandidates: TimedLiveScheduleMatch[] = [];
  const seenMatchKeys = new Set<string>();

  for (const candidate of candidates) {
    const matchKey = getMatchKey(candidate);
    if (seenMatchKeys.has(matchKey)) continue;
    seenMatchKeys.add(matchKey);
    uniqueCandidates.push(candidate);
  }

  const recentlyStarted = uniqueCandidates.filter(
    ({ kickoffTimestamp }) =>
      kickoffTimestamp >= nowTimestamp - LIVE_LOOKBACK_MS &&
      kickoffTimestamp <= nowTimestamp,
  );
  const upcoming = uniqueCandidates
    .filter(({ kickoffTimestamp }) => kickoffTimestamp > nowTimestamp)
    .slice(0, UPCOMING_MATCH_LIMIT);

  return [...recentlyStarted, ...upcoming]
    .sort(compareCandidates)
    .map(({ effectiveShortcut, league, match, season }) => ({
      effectiveShortcut,
      league,
      match,
      season,
    }));
};

export const getLiveSchedule = async (
  options: GetLiveScheduleOptions = {},
): Promise<LiveScheduleResult> => {
  const now = options.now ?? new Date();
  const checkedAt = now.getTime();
  if (Number.isNaN(checkedAt)) {
    throw new RangeError("Live schedule requires a valid current date");
  }

  const requestTimeoutMs =
    options.requestTimeoutMs ?? LIVE_SCHEDULE_REQUEST_TIMEOUT_MS;
  if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs <= 0) {
    throw new RangeError("Live schedule timeout must be a positive number");
  }

  const dataSource = options.dataSource ?? openLigaDbLiveDataSource;
  const season = getCurrentSeasonYear(now);
  let availableLeagues: ApiLeague[] = [];

  try {
    availableLeagues = await runWithTimeout(
      (signal) =>
        dataSource.getAvailableLeaguesBySeason(season, {
          signal,
          next: {
            revalidate: OPENLIGADB_CACHE_SECONDS.availableLeagues,
          },
        }),
      requestTimeoutMs,
    );
  } catch {
    // Known canonical shortcuts still allow partial live data when metadata fails.
  }

  const requests = resolveCompetitionRequests({
    availableLeagues,
    season,
  });
  const results = await loadCompetitionSchedules({
    dataSource,
    requests,
    requestTimeoutMs,
  });

  return {
    matches: selectScheduleMatches({
      results,
      nowTimestamp: checkedAt,
    }),
    failedLeagues: results.flatMap((result) =>
      result.status === "rejected" ? [result.request.league] : [],
    ),
    checkedAt,
  };
};
