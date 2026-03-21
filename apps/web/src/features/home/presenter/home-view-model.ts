import type { HomeErrorKey, HomeRoundSnapshot, HomeState } from "@footballleagues/core/home";
import { getLeagueLabel } from "@footballleagues/core/leagues";
import { localizeGroupName, type KnockoutTie } from "@footballleagues/core/matches";
import type { ApiMatch, ApiTableRow } from "@footballleagues/core/openligadb";

const ERROR_LABEL_MAP: Record<HomeErrorKey, string> = {
  "current group": "aktuelle Runde",
  matchday: "Spieltagsergebnisse",
  table: "Tabelle",
  groups: "Gruppen",
  playoffs: "Playoff-Spiele",
  "next groups": "nächste Runden",
  "next matchday": "Spiele der nächsten Runde",
  "knockout rounds": "K.-o.-Runden",
};

const getRoundTitle = (
  round: HomeRoundSnapshot,
  {
    usesKnockoutLabels,
    emptyFallback,
  }: {
    usesKnockoutLabels: boolean;
    emptyFallback: string;
  }
) => {
  if (round.groupName?.trim()) return localizeGroupName(round.groupName);

  if (typeof round.groupOrderID === "number") {
    return usesKnockoutLabels
      ? `Runde ${round.groupOrderID}`
      : `${round.groupOrderID}. Spieltag`;
  }

  return emptyFallback;
};

export type WebHomeRoundSection =
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

export type WebHomeTableSection = {
  key: "table";
  kicker: "Tabelle";
  title: "Tabelle";
  subtitle: string;
  emptyText: string;
  renderKind: "table";
  items: ApiTableRow[];
};

export type WebHomeSection = WebHomeRoundSection | WebHomeTableSection;

export type WebHomeViewModel = {
  resolvedLeague: HomeState["resolvedLeague"];
  resolvedSeason: number;
  leagueLabel: string;
  leagueOptions: HomeState["leagueOptions"];
  hasTable: boolean;
  bracketMatches: HomeState["bracketMatches"];
  visibleErrors: string[];
  sections: WebHomeSection[];
};

const createWebRoundSection = ({
  state,
  key,
  round,
  renderKind,
  items,
}: {
  state: HomeState;
  key: "next-round" | "matchday";
  round: HomeRoundSnapshot;
  renderKind: "matches";
  items: ApiMatch[];
} | {
  state: HomeState;
  key: "next-round" | "matchday";
  round: HomeRoundSnapshot;
  renderKind: "ties";
  items: KnockoutTie[];
}): WebHomeRoundSection => {
  const isNextRound = key === "next-round";
  const kicker: "Nächste Runde" | "Spieltag" = isNextRound ? "Nächste Runde" : "Spieltag";
  const baseSection = {
    key,
    kicker,
    title: getRoundTitle(round, {
      usesKnockoutLabels: state.usesKnockoutLabels,
      emptyFallback: isNextRound
        ? state.usesKnockoutLabels
          ? "Nächste Runde"
          : "Nächster Spieltag"
        : "Aktueller Spieltag",
    }),
    subtitle: `${getLeagueLabel(state.resolvedLeague)} · Saison ${state.resolvedSeason}`,
    emptyText: isNextRound
      ? "Noch keine kommenden Spiele verfügbar."
      : "Für diese Runde sind noch keine Ergebnisse verfügbar.",
  };

  if (renderKind === "matches") {
    return {
      ...baseSection,
      renderKind: "matches",
      items,
    };
  }

  return {
    ...baseSection,
    renderKind: "ties",
    items,
  };
};

export const createWebHomeViewModel = (state: HomeState): WebHomeViewModel => {
  const leagueLabel = getLeagueLabel(state.resolvedLeague);

  const sections: WebHomeSection[] = state.sections.map((section) => {
    if (section.renderKind === "table") {
      return {
        key: "table",
        kicker: "Tabelle",
        title: "Tabelle",
        subtitle: "Aktualisierte Tabelle für die ausgewählte Saison.",
        emptyText: "Tabellendaten sind noch nicht verfügbar.",
        renderKind: "table",
        items: section.items,
      };
    }

    if (section.renderKind === "matches") {
      return createWebRoundSection({
        state,
        key: section.key,
        round: section.round,
        renderKind: "matches",
        items: section.items,
      });
    }

    return createWebRoundSection({
      state,
      key: section.key,
      round: section.round,
      renderKind: "ties",
      items: section.items,
    });
  });

  return {
    resolvedLeague: state.resolvedLeague,
    resolvedSeason: state.resolvedSeason,
    leagueLabel,
    leagueOptions: state.leagueOptions,
    hasTable: state.hasTable,
    bracketMatches: state.bracketMatches,
    visibleErrors: state.errorKeys.map((key) => ERROR_LABEL_MAP[key]),
    sections,
  };
};
