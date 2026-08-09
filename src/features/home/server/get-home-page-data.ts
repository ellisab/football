import { createHomeState, getHomeSnapshot } from "@footballleagues/core/home";
import {
  DEFAULT_LEAGUE,
  getCurrentSeasonYear,
  getLeagueLabel,
  hasLeagueTable,
  isLeagueKey,
  LEAGUE_GROUPS,
  type LeagueKey,
} from "@footballleagues/core/leagues";
import type {
  WebCompetitionViewModel,
  WebHomeViewModel,
} from "../presenter/home-view-model";
import { createWebHomeViewModel } from "../presenter/home-view-model";
import { requireCacheableHomeSnapshot } from "./home-snapshot-cache-policy";

const OPENLIGADB_UNAVAILABLE_ERROR = "OpenLigaDB ist gerade nicht verfügbar";

type CompetitionParams = {
  league?: string;
  season?: string;
};

const getFallbackLeague = (value?: string): LeagueKey =>
  value && isLeagueKey(value) ? value : DEFAULT_LEAGUE;

const getFallbackSeason = (value?: string) => {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isNaN(parsed) ? getCurrentSeasonYear() : parsed;
};

const createFallbackCompetitionData = (
  params: CompetitionParams,
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

const getCompetitionData = async (
  params: CompetitionParams,
): Promise<WebCompetitionViewModel> => {
  try {
    const snapshot = requireCacheableHomeSnapshot(
      await getHomeSnapshot(params),
    );
    const state = createHomeState(snapshot);

    return {
      ...createWebHomeViewModel(state),
      availableGroups: state.availableGroups ?? [],
    };
  } catch (error) {
    console.warn("[OpenLigaDB] home snapshot failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      event: "home_snapshot_failed",
      league: params.league,
      season: params.season,
    });
    return createFallbackCompetitionData(params);
  }
};

const createOverviewData = (
  seed: WebCompetitionViewModel,
  competitions: WebCompetitionViewModel[],
): WebHomeViewModel => ({
  ...seed,
  competitions,
  isOverview: true,
  leagueLabel: "Alle Wettbewerbe",
  visibleErrors: Array.from(
    new Set([
      ...seed.visibleErrors,
      ...competitions.flatMap((competition) => competition.visibleErrors),
    ]),
  ),
});

export const getHomePageData = async (params: {
  group?: string;
  league?: string;
  season?: string;
}) => {
  if (params.league) return getCompetitionData(params);

  const seed = await getCompetitionData({});
  const competitions = await Promise.all(
    seed.leagueOptions.map((option) =>
      option.shortcut === seed.resolvedLeague
        ? seed
        : getCompetitionData({
            league: option.shortcut,
            season: String(option.seasons[0] ?? seed.resolvedSeason),
          }),
    ),
  );

  return createOverviewData(seed, competitions);
};
