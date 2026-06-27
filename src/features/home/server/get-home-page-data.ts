import {
  getCurrentSeasonYear,
  getLeagueLabel,
  hasLeagueTable,
  isLeagueKey,
  LEAGUE_GROUPS,
  type LeagueKey,
} from "@footballleagues/core/leagues";
import { createHomeState, getHomeSnapshot } from "@footballleagues/core/home";
import { getWorldCupSnapshot } from "@footballleagues/core/world-cup";
import { unstable_cache } from "next/cache";
import { createWebHomeViewModel } from "../presenter/home-view-model";
import type { WebCompetitionViewModel } from "../presenter/home-view-model";

const REVALIDATE_SECONDS = 60;
const WORLD_CUP_TIMEOUT_MS = 4_000;
const REVALIDATE = { next: { revalidate: REVALIDATE_SECONDS } };
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
  ["home-snapshot"],
  { revalidate: REVALIDATE_SECONDS }
);
const getCachedWorldCupSnapshot = unstable_cache(
  async (season: number) => {
    try {
      return {
        data: await getWorldCupSnapshot({
          season,
          requestOptions: {
            ...REVALIDATE,
            signal: AbortSignal.timeout(WORLD_CUP_TIMEOUT_MS),
          },
        }),
      };
    } catch {
      return { data: undefined };
    }
  },
  ["world-cup-snapshot"],
  { revalidate: REVALIDATE_SECONDS }
);

const getCompetitionData = async (
  params: {
    league?: string;
    season?: string;
  }
): Promise<WebCompetitionViewModel> => {
  const snapshotResult = await getCachedHomeSnapshot(params);
  if (!snapshotResult.data) {
    return createFallbackCompetitionData(params);
  }

  const state = createHomeState(snapshotResult.data);
  const worldCupResult =
    state.resolvedLeague === "wc"
      ? await getCachedWorldCupSnapshot(state.resolvedSeason)
      : undefined;

  return {
    ...createWebHomeViewModel(state),
    worldCup: worldCupResult?.data,
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
