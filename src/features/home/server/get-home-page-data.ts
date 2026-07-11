import {
  getCurrentSeasonYear,
  getLeagueLabel,
  hasLeagueTable,
  isLeagueKey,
  LEAGUE_GROUPS,
  type LeagueKey,
} from "@footballleagues/core/leagues";
import { createHomeState, getHomeSnapshot } from "@footballleagues/core/home";
import { OPENLIGADB_CACHE_SECONDS } from "@footballleagues/core/openligadb";
import { getWorldCupSnapshot } from "@footballleagues/core/world-cup";
import { unstable_cache } from "next/cache";
import { createWebHomeViewModel } from "../presenter/home-view-model";
import type {
  WebCompetitionViewModel,
  WebHomeViewModel,
} from "../presenter/home-view-model";
import {
  createKeyedSingleFlight,
  createSingleFlight,
  createStaleOnError,
  IncompleteSnapshotError,
  mapWithConcurrency,
  requireCacheableHomeSnapshot,
  requireCacheableWorldCupSnapshot,
  SnapshotTimeoutError,
  withSnapshotDeadline,
} from "./home-snapshot-cache-policy";

const REVALIDATE = {
  next: { revalidate: OPENLIGADB_CACHE_SECONDS.homeSnapshot },
};
const HOME_DATA_CACHE_VERSION = "results-v4";
const HOME_SNAPSHOT_TIMEOUT_MS = 6_000;
const OVERVIEW_SNAPSHOT_TIMEOUT_MS = 15_000;
const OVERVIEW_COMPETITION_CONCURRENCY = 3;
const OPENLIGADB_UNAVAILABLE_ERROR = "OpenLigaDB ist gerade nicht verfügbar";

type CompetitionParams = {
  league?: string;
  season?: string;
};

type SnapshotScope = "competition" | "overview" | "world-cup";

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
    requireCacheableHomeSnapshot(
      await getHomeSnapshot(params, { requestOptions: REVALIDATE })
    ),
  getCompetitionCacheKey
);
const getCachedHomeSnapshot = unstable_cache(
  loadHomeSnapshotSingleFlight,
  ["home-snapshot", HOME_DATA_CACHE_VERSION],
  { revalidate: OPENLIGADB_CACHE_SECONDS.homeSnapshot }
);

const loadWorldCupSnapshotSingleFlight = createKeyedSingleFlight(
  async (season: number) =>
    requireCacheableWorldCupSnapshot(
      await getWorldCupSnapshot({
        season,
        requestOptions: REVALIDATE,
      })
    ),
  (season) => String(season)
);
const getCachedWorldCupSnapshot = unstable_cache(
  loadWorldCupSnapshotSingleFlight,
  ["world-cup-snapshot", HOME_DATA_CACHE_VERSION],
  { revalidate: OPENLIGADB_CACHE_SECONDS.liveMatchday }
);

const getCompetitionDataOrThrow = async (
  params: CompetitionParams
): Promise<WebCompetitionViewModel> => {
  const snapshot = await getCachedHomeSnapshot(params);
  const state = createHomeState(snapshot);
  const baseViewModel = createWebHomeViewModel(state);

  if (state.resolvedLeague !== "wc") {
    return {
      ...baseViewModel,
      availableGroups: state.availableGroups ?? [],
    };
  }

  const worldCup = await getCachedWorldCupSnapshot(state.resolvedSeason);

  return {
    ...baseViewModel,
    worldCup,
    availableGroups: worldCup.groups,
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

    const fallback = createFallbackCompetitionData(params);
    const remainingMs = HOME_SNAPSHOT_TIMEOUT_MS - (Date.now() - startedAt);

    if (fallback.resolvedLeague !== "wc" || remainingMs <= 0) {
      return fallback;
    }

    const worldCupStartedAt = Date.now();
    try {
      const worldCup = await withSnapshotDeadline(
        getCachedWorldCupSnapshot(fallback.resolvedSeason),
        remainingMs
      );

      return {
        ...fallback,
        worldCup,
        availableGroups: worldCup.groups,
      };
    } catch (worldCupError) {
      logSnapshotFallback({
        error: worldCupError,
        params: {
          league: fallback.resolvedLeague,
          season: String(fallback.resolvedSeason),
        },
        scope: "world-cup",
        startedAt: worldCupStartedAt,
      });
      return fallback;
    }
  }
};

const getFallbackLeague = (value?: string): LeagueKey => {
  return value && isLeagueKey(value) ? value : "wc";
};

const getFallbackSeason = (league: LeagueKey, value?: string) => {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isNaN(parsed)) return parsed;

  return league === "wc" ? 2026 : getCurrentSeasonYear();
};

const createFallbackCompetitionData = (
  params: CompetitionParams
): WebCompetitionViewModel => {
  const resolvedLeague = getFallbackLeague(params.league);
  const resolvedSeason = getFallbackSeason(resolvedLeague, params.season);
  const leagueLabel = getLeagueLabel(resolvedLeague);
  const tableSupported = hasLeagueTable(resolvedLeague);

  return {
    bracketMatches: [],
    availableGroups: [],
    hasTable: tableSupported,
    leagueLabel,
    leagueOptions: LEAGUE_GROUPS.map((group) => ({
      label: group.label,
      seasons: [group.key === "wc" ? 2026 : getCurrentSeasonYear()],
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

const buildLoggedOverviewData = async () => {
  const startedAt = Date.now();
  try {
    return await buildOverviewDataOrThrow();
  } catch (error) {
    logSnapshotFallback({
      error,
      params: {},
      scope: "overview",
      startedAt,
    });
    throw error;
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
