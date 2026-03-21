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

export type MobileHomeRoundSection =
  | {
      key: "next-round" | "matchday";
      kicker: "Nächste Runde" | "Spieltag";
      title: string;
      subtitle: string;
      emptyText: string;
      renderKind: "matches";
      data: ApiMatch[];
    }
  | {
      key: "next-round" | "matchday";
      kicker: "Nächste Runde" | "Spieltag";
      title: string;
      subtitle: string;
      emptyText: string;
      renderKind: "ties";
      data: KnockoutTie[];
    };

export type MobileHomeTableSection = {
  key: "table";
  kicker: "Tabelle";
  title: "Tabelle";
  subtitle: string;
  emptyText: string;
  renderKind: "table";
  data: ApiTableRow[];
};

export type MobileHomeSection = MobileHomeRoundSection | MobileHomeTableSection;

export type MobileHomeViewModel = {
  resolvedLeague: HomeState["resolvedLeague"];
  resolvedSeason: number;
  leagueLabel: string;
  leagueOptions: HomeState["leagueOptions"];
  hasTable: boolean;
  bracketMatches: HomeState["bracketMatches"];
  visibleErrors: string[];
  sections: MobileHomeSection[];
};

const createMobileRoundSection = ({
  state,
  key,
  round,
  renderKind,
  data,
}: {
  state: HomeState;
  key: "next-round" | "matchday";
  round: HomeRoundSnapshot;
  renderKind: "matches";
  data: ApiMatch[];
} | {
  state: HomeState;
  key: "next-round" | "matchday";
  round: HomeRoundSnapshot;
  renderKind: "ties";
  data: KnockoutTie[];
}): MobileHomeRoundSection => {
  const isNextRound = key === "next-round";
  const kicker: "Nächste Runde" | "Spieltag" = isNextRound ? "Nächste Runde" : "Spieltag";
  const seasonSubtitle = `Saison ${state.resolvedSeason}`;
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
    subtitle: isNextRound ? `${seasonSubtitle} · kommende Spiele` : seasonSubtitle,
    emptyText: isNextRound
      ? "Noch keine kommenden Spiele verfügbar."
      : "Für diese Runde sind noch keine Ergebnisse verfügbar.",
  };

  if (renderKind === "matches") {
    return {
      ...baseSection,
      renderKind: "matches",
      data,
    };
  }

  return {
    ...baseSection,
    renderKind: "ties",
    data,
  };
};

export const createMobileHomeViewModel = (state: HomeState): MobileHomeViewModel => {
  const leagueLabel = getLeagueLabel(state.resolvedLeague);

  const sections: MobileHomeSection[] = state.sections.map((section) => {
    if (section.renderKind === "table") {
      return {
        key: "table",
        kicker: "Tabelle",
        title: "Tabelle",
        subtitle: "Aktualisierte Tabelle für die ausgewählte Saison.",
        emptyText: "Tabellendaten sind noch nicht verfügbar.",
        renderKind: "table",
        data: section.items,
      };
    }

    if (section.renderKind === "matches") {
      return createMobileRoundSection({
        state,
        key: section.key,
        round: section.round,
        renderKind: "matches",
        data: section.items,
      });
    }

    return createMobileRoundSection({
      state,
      key: section.key,
      round: section.round,
      renderKind: "ties",
      data: section.items,
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
