import {
  DEFAULT_LEAGUE,
  getCurrentSeasonYear,
  getLeagueLabel,
  hasLeagueTable,
  isLeagueKey,
  LEAGUE_GROUPS,
  type LeagueKey,
} from "@footballleagues/core/leagues";
import { createHomeState, getHomeSnapshot } from "@footballleagues/core/home";
import { OPENLIGADB_CACHE_SECONDS } from "@footballleagues/core/openligadb";
import { unstable_cache } from "next/cache";
import { getFootballRuntimeCache } from "@/lib/server/runtime-cache";
import { createWebHomeViewModel } from "../presenter/home-view-model";
import type {
  WebCompetitionViewModel,
  WebHomeViewModel,
} from "../presenter/home-view-model";
import {
  createKeyedSingleFlight,
  createSharedStaleBackoff,
  createSingleFlight,
  createStaleOnError,
  IncompleteSnapshotError,
  mapWithConcurrency,
  requireCacheableHomeSnapshot,
  SnapshotTimeoutError,
  withAbortableSnapshotDeadline,
  withSnapshotDeadline,
} from "./home-snapshot-cache-policy";

const REVALIDATE = {
  next: { revalidate: OPENLIGADB_CACHE_SECONDS.homeSnapshot },
};
const HOME_DATA_CACHE_VERSION = "results-v6";
const HOME_SNAPSHOT_TIMEOUT_MS = 6_000;
const OVERVIEW_SNAPSHOT_TIMEOUT_MS = 15_000;
const OVERVIEW_COMPETITION_CONCURRENCY = 3;
const OVERVIEW_STALE_MAX_AGE_MS = 6 * 60 * 60 * 1_000;
const OVERVIEW_STALE_TTL_SECONDS = 6 * 60 * 60;
const OPENLIGADB_UNAVAILABLE_ERROR = "OpenLigaDB ist gerade nicht verfügbar";

type CompetitionParams = {
  league?: string;
  season?: string;
};

type SnapshotScope = "competition" | "overview";

const getCompetitionCacheKey = (params: CompetitionParams) =>
  `${params.league ?? "default"}:${params.season ?? "default"}`;

const getFailureClassification = (error: unknown) => {
  if (error instanceof SnapshotTimeoutError) return "timeout";
  if (error instanceof IncompleteSnapshotError) return "incomplete";
  return "upstream";
};

const logSnapshotFallback = ({
  error,
  params,
  scope,
  startedAt,
}: {
  error: unknown;
  params: CompetitionParams;
  scope: SnapshotScope;
  startedAt: number;
}) => {
  console.warn("[OpenLigaDB] snapshot fallback", {
    event: "snapshot_fallback",
    scope,
    league: params.league,
    season: params.season,
    durationMs: Date.now() - startedAt,
    classification: getFailureClassification(error),
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorKeys:
      error instanceof IncompleteSnapshotError ? error.errorKeys : undefined,
  });
};

const logStaleSnapshot = ({
  error,
  params,
  scope,
}: {
  error: unknown;
  params: CompetitionParams;
  scope: SnapshotScope;
}) => {
  console.warn("[OpenLigaDB] serving last successful snapshot", {
    event: "snapshot_stale",
    scope,
    league: params.league,
    season: params.season,
    classification: getFailureClassification(error),
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorKeys:
      error instanceof IncompleteSnapshotError ? error.errorKeys : undefined,
  });
};

const loadHomeSnapshotSingleFlight = createKeyedSingleFlight(
  async (params: CompetitionParams) =>
    withAbortableSnapshotDeadline(
      async (signal) =>
        requireCacheableHomeSnapshot(
          await getHomeSnapshot(params, {
            requestOptions: { ...REVALIDATE, signal },
          })
        ),
      HOME_SNAPSHOT_TIMEOUT_MS
    ),
  getCompetitionCacheKey
);
const getCachedHomeSnapshot = unstable_cache(
  loadHomeSnapshotSingleFlight,
  ["home-snapshot", HOME_DATA_CACHE_VERSION],
  { revalidate: OPENLIGADB_CACHE_SECONDS.homeSnapshot }
);

const getCompetitionDataOrThrow = async (
  params: CompetitionParams
): Promise<WebCompetitionViewModel> => {
  const snapshot = await getCachedHomeSnapshot(params);
  const state = createHomeState(snapshot);

  return {
    ...createWebHomeViewModel(state),
    availableGroups: state.availableGroups ?? [],
  };
};

const getCompetitionDataWithStaleFallback = createStaleOnError(
  (params: CompetitionParams) =>
    withSnapshotDeadline(
      getCompetitionDataOrThrow(params),
      HOME_SNAPSHOT_TIMEOUT_MS
    ),
  getCompetitionCacheKey,
  {
    onStale: ({ args: [params], error }) =>
      logStaleSnapshot({ error, params, scope: "competition" }),
  }
);

const getCompetitionData = async (
  params: CompetitionParams
): Promise<WebCompetitionViewModel> => {
  const startedAt = Date.now();

  try {
    return await getCompetitionDataWithStaleFallback(params);
  } catch (error) {
    logSnapshotFallback({
      error,
      params,
      scope: "competition",
      startedAt,
    });

    return createFallbackCompetitionData(params);
  }
};

const getFallbackLeague = (value?: string): LeagueKey => {
  return value && isLeagueKey(value) ? value : DEFAULT_LEAGUE;
};

const getFallbackSeason = (value?: string) => {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isNaN(parsed)) return parsed;

  return getCurrentSeasonYear();
};

const createFallbackCompetitionData = (
  params: CompetitionParams
): WebCompetitionViewModel => {
  const resolvedLeague = getFallbackLeague(params.league);
  const resolvedSeason = getFallbackSeason(params.season);
  const leagueLabel = getLeagueLabel(resolvedLeague);
  const tableSupported = hasLeagueTable(resolvedLeague);

  return {
    bracketMatches: [],
    availableGroups: [],
    hasTable: tableSupported,
    leagueLabel,
    leagueOptions: LEAGUE_GROUPS.map((group) => ({
      label: group.label,
      seasons: [getCurrentSeasonYear()],
      shortcut: group.key,
    })),
    resolvedLeague,
    resolvedSeason,
    sections: [
      {
        emptyText:
          "OpenLigaDB konnte gerade keine Spieldaten liefern. Bitte später erneut versuchen.",
        items: [],
        key: "next-round",
        kicker: "Nächste Runde",
        renderKind: "matches",
        subtitle: `${leagueLabel} · Saison ${resolvedSeason}`,
        title: "Nächste Runde",
      },
      {
        emptyText:
          "OpenLigaDB konnte gerade keine Ergebnisse liefern. Bitte später erneut versuchen.",
        items: [],
        key: "matchday",
        kicker: "Spieltag",
        renderKind: "matches",
        subtitle: `${leagueLabel} · Saison ${resolvedSeason}`,
        title: "Aktueller Spieltag",
      },
      ...(tableSupported
        ? [
            {
              emptyText:
                "Tabellendaten konnten gerade nicht geladen werden. Fixtures bleiben sichtbar.",
              items: [],
              key: "table" as const,
              kicker: "Tabelle" as const,
              renderKind: "table" as const,
              subtitle: "Aktualisierte Tabelle für die ausgewählte Saison.",
              title: "Tabelle" as const,
            },
          ]
        : []),
    ],
    visibleErrors: [OPENLIGADB_UNAVAILABLE_ERROR],
  };
};

const createOverviewData = (
  seed: WebCompetitionViewModel,
  competitions: WebCompetitionViewModel[]
): WebHomeViewModel => ({
  ...seed,
  competitions,
  isOverview: true,
  leagueLabel: "Alle Wettbewerbe",
  visibleErrors: Array.from(
    new Set([
      ...seed.visibleErrors,
      ...competitions.flatMap((competition) => competition.visibleErrors),
    ])
  ),
});

const buildOverviewDataOrThrow = async () => {
  const seed = await getCompetitionDataOrThrow({});
  const competitions = await mapWithConcurrency(
    seed.leagueOptions,
    OVERVIEW_COMPETITION_CONCURRENCY,
    (option) =>
      getCompetitionDataOrThrow({
        league: option.shortcut,
        season: String(option.seasons[0] ?? seed.resolvedSeason),
      })
  );

  return createOverviewData(seed, competitions);
};

const loadOverviewDataWithSharedBackoff = createSharedStaleBackoff(
  buildOverviewDataOrThrow,
  () => `home-overview:${HOME_DATA_CACHE_VERSION}`,
  {
    getCache: getFootballRuntimeCache,
    maxStaleMs: OVERVIEW_STALE_MAX_AGE_MS,
    onStale: ({ error }) =>
      logStaleSnapshot({ error, params: {}, scope: "overview" }),
    ttlSeconds: OVERVIEW_STALE_TTL_SECONDS,
  }
);

const buildLoggedOverviewData = async () => {
  const startedAt = Date.now();

  try {
    return await loadOverviewDataWithSharedBackoff();
  } catch (error) {
    logSnapshotFallback({
      error,
      params: {},
      scope: "overview",
      startedAt,
    });
    return createFallbackOverviewData();
  }
};

const buildOverviewDataSingleFlight = createSingleFlight(
  buildLoggedOverviewData
);
const getCachedOverviewData = unstable_cache(
  buildOverviewDataSingleFlight,
  ["home-overview", HOME_DATA_CACHE_VERSION],
  { revalidate: OPENLIGADB_CACHE_SECONDS.homeSnapshot }
);

const getOverviewDataWithStaleFallback = createStaleOnError(
  () =>
    withSnapshotDeadline(
      getCachedOverviewData(),
      OVERVIEW_SNAPSHOT_TIMEOUT_MS
    ),
  () => "overview",
  {
    maxEntries: 1,
    onStale: ({ error }) =>
      logStaleSnapshot({ error, params: {}, scope: "overview" }),
  }
);
const getOverviewDataSingleFlight = createSingleFlight(
  getOverviewDataWithStaleFallback
);

const createFallbackOverviewData = () => {
  const seed = createFallbackCompetitionData({});
  const competitions = seed.leagueOptions.map((option) =>
    createFallbackCompetitionData({
      league: option.shortcut,
      season: String(option.seasons[0] ?? seed.resolvedSeason),
    })
  );

  return createOverviewData(seed, competitions);
};

export const getHomePageData = async (params: {
  group?: string;
  league?: string;
  season?: string;
}) => {
  if (params.league) {
    return getCompetitionData(params);
  }

  const startedAt = Date.now();
  try {
    return await getOverviewDataSingleFlight();
  } catch (error) {
    logSnapshotFallback({
      error,
      params,
      scope: "overview",
      startedAt,
    });
    return createFallbackOverviewData();
  }
};
