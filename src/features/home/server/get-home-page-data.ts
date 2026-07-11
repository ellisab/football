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
import type { WebCompetitionViewModel } from "../presenter/home-view-model";

const REVALIDATE = {
  next: { revalidate: OPENLIGADB_CACHE_SECONDS.homeSnapshot },
};
const HOME_DATA_CACHE_VERSION = "results-v3";
const HOME_SNAPSHOT_TIMEOUT_MS = 6_000;

const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  getFallback: () => T
): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeout = setTimeout(() => resolve(getFallback()), timeoutMs);
  });

  return Promise.race([
    promise.finally(() => {
      if (timeout) clearTimeout(timeout);
    }),
    timeoutPromise,
  ]);
};

const getCachedHomeSnapshot = unstable_cache(
  async (params: { league?: string; season?: string }) => {
    try {
      return {
        data: await getHomeSnapshot(params, { requestOptions: REVALIDATE }),
      };
    } catch {
      return { data: undefined };
    }
  },
  ["home-snapshot", HOME_DATA_CACHE_VERSION],
  { revalidate: OPENLIGADB_CACHE_SECONDS.homeSnapshot }
);
const getCachedWorldCupSnapshot = unstable_cache(
  async (season: number) => {
    try {
      return {
        data: await getWorldCupSnapshot({
          season,
          requestOptions: REVALIDATE,
        }),
      };
    } catch {
      return { data: undefined };
    }
  },
  ["world-cup-snapshot", HOME_DATA_CACHE_VERSION],
  { revalidate: OPENLIGADB_CACHE_SECONDS.liveMatchday }
);

const getCompetitionData = async (
  params: {
    league?: string;
    season?: string;
  }
): Promise<WebCompetitionViewModel> => {
  const snapshotResult = await withTimeout(
    getCachedHomeSnapshot(params),
    HOME_SNAPSHOT_TIMEOUT_MS,
    () => ({ data: undefined })
  );
  if (!snapshotResult.data) {
    const fallback = createFallbackCompetitionData(params);
    const worldCupResult =
      fallback.resolvedLeague === "wc"
        ? await withTimeout(
            getCachedWorldCupSnapshot(fallback.resolvedSeason),
            HOME_SNAPSHOT_TIMEOUT_MS,
            () => ({ data: undefined })
          )
        : undefined;

    return {
      ...fallback,
      worldCup: worldCupResult?.data,
      availableGroups:
        worldCupResult?.data?.groups ?? fallback.availableGroups,
    };
  }

  const state = createHomeState(snapshotResult.data);
  const worldCupResult =
    state.resolvedLeague === "wc"
      ? await withTimeout(
          getCachedWorldCupSnapshot(state.resolvedSeason),
          HOME_SNAPSHOT_TIMEOUT_MS,
          () => ({ data: undefined })
        )
      : undefined;

  return {
    ...createWebHomeViewModel(state),
    worldCup: worldCupResult?.data,
    availableGroups:
      worldCupResult?.data?.groups ?? state.availableGroups ?? [],
  };
};

const getFallbackLeague = (value?: string): LeagueKey => {
  return value && isLeagueKey(value) ? value : "wc";
};

const getFallbackSeason = (league: LeagueKey, value?: string) => {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isNaN(parsed)) return parsed;

  return league === "wc" ? 2026 : getCurrentSeasonYear();
};

const createFallbackCompetitionData = (params: {
  league?: string;
  season?: string;
}): WebCompetitionViewModel => {
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
    visibleErrors: ["OpenLigaDB ist gerade nicht verfügbar"],
  };
};

export const getHomePageData = async (params: {
  group?: string;
  league?: string;
  season?: string;
}) => {
  if (params.league) {
    return getCompetitionData(params);
  }

  const seed = await getCompetitionData(params);
  const competitions = await Promise.all(
    seed.leagueOptions.map((option) =>
      getCompetitionData({
        league: option.shortcut,
        season: String(option.seasons[0] ?? seed.resolvedSeason),
      })
    )
  );

  return {
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
  };
};
