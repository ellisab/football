import { getLeagueLabel } from "../leagues";
import { localizeGroupName, type KnockoutTie } from "../matches";
import type { ApiMatch, ApiTableRow } from "../openligadb";
import type { HomeState } from "./model";
import type { HomeErrorKey, HomeRoundSnapshot } from "./types";

export const HOME_ERROR_LABEL_MAP: Record<HomeErrorKey, string> = {
  "current group": "aktuelle Runde",
  matchday: "Spieltagsergebnisse",
  table: "Tabelle",
  groups: "Gruppen",
  playoffs: "Playoff-Spiele",
  "next groups": "nächste Runden",
  "next matchday": "Spiele der nächsten Runde",
  "knockout rounds": "K.-o.-Runden",
};

export const getHomeRoundTitle = (
  round: HomeRoundSnapshot,
  {
    usesKnockoutLabels,
    emptyFallback,
  }: {
    usesKnockoutLabels: boolean;
    emptyFallback: string;
  }
) => {
  if (round.groupName?.trim()) {
    return localizeGroupName(round.groupName);
  }

  if (typeof round.groupOrderID === "number") {
    return usesKnockoutLabels
      ? `Runde ${round.groupOrderID}`
      : `${round.groupOrderID}. Spieltag`;
  }

  return emptyFallback;
};

export type HomeViewModelRoundSection =
  | {
      key: "next-round" | "matchday";
      kicker: "Nächste Runde" | "Spieltag";
      title: string;
      subtitle: string;
      emptyText: string;
      renderKind: "matches";
      items: ApiMatch[];
    }
  | {
      key: "next-round" | "matchday";
      kicker: "Nächste Runde" | "Spieltag";
      title: string;
      subtitle: string;
      emptyText: string;
      renderKind: "ties";
      items: KnockoutTie[];
    };

export type HomeViewModelTableSection = {
  key: "table";
  kicker: "Tabelle";
  title: "Tabelle";
  subtitle: string;
  emptyText: string;
  renderKind: "table";
  items: ApiTableRow[];
};

export type HomeViewModelSection =
  | HomeViewModelRoundSection
  | HomeViewModelTableSection;

export type HomeViewModel = {
  resolvedLeague: HomeState["resolvedLeague"];
  resolvedSeason: number;
  leagueLabel: string;
  leagueOptions: HomeState["leagueOptions"];
  hasTable: boolean;
  bracketMatches: HomeState["bracketMatches"];
  visibleErrors: string[];
  sections: HomeViewModelSection[];
};

export const createHomeViewModel = (
  state: HomeState,
  options: {
    getRoundSubtitle: (args: {
      state: HomeState;
      key: "next-round" | "matchday";
      isNextRound: boolean;
      leagueLabel: string;
    }) => string;
    tableSubtitle?: string;
    tableEmptyText?: string;
  }
): HomeViewModel => {
  const leagueLabel = getLeagueLabel(state.resolvedLeague);

  const sections: HomeViewModelSection[] = state.sections.map((section) => {
    if (section.renderKind === "table") {
      return {
        key: "table",
        kicker: "Tabelle",
        title: "Tabelle",
        subtitle:
          options.tableSubtitle ?? "Aktualisierte Tabelle für die ausgewählte Saison.",
        emptyText:
          options.tableEmptyText ?? "Tabellendaten sind noch nicht verfügbar.",
        renderKind: "table",
        items: section.items,
      };
    }

    const isNextRound = section.key === "next-round";
    const kicker: "Nächste Runde" | "Spieltag" = isNextRound
      ? "Nächste Runde"
      : "Spieltag";
    const baseSection = {
      key: section.key,
      kicker,
      title: getHomeRoundTitle(section.round, {
        usesKnockoutLabels: state.usesKnockoutLabels,
        emptyFallback: isNextRound
          ? state.usesKnockoutLabels
            ? "Nächste Runde"
            : "Nächster Spieltag"
          : "Aktueller Spieltag",
      }),
      subtitle: options.getRoundSubtitle({
        state,
        key: section.key,
        isNextRound,
        leagueLabel,
      }),
      emptyText: isNextRound
        ? "Noch keine kommenden Spiele verfügbar."
        : "Für diese Runde sind noch keine Ergebnisse verfügbar.",
    };

    if (section.renderKind === "matches") {
      return {
        ...baseSection,
        renderKind: "matches",
        items: section.items,
      };
    }

    return {
      ...baseSection,
      renderKind: "ties",
      items: section.items,
    };
  });

  return {
    resolvedLeague: state.resolvedLeague,
    resolvedSeason: state.resolvedSeason,
    leagueLabel,
    leagueOptions: state.leagueOptions,
    hasTable: state.hasTable,
    bracketMatches: state.bracketMatches,
    visibleErrors: state.errorKeys.map((key) => HOME_ERROR_LABEL_MAP[key]),
    sections,
  };
};
