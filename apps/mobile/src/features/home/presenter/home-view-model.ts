import type { HomeErrorKey, HomeRoundSnapshot, HomeState } from "@footballleagues/core/home";
import { getLeagueLabel } from "@footballleagues/core/leagues";
import type { KnockoutTie } from "@footballleagues/core/matches";
import type { ApiMatch, ApiTableRow } from "@footballleagues/core/openligadb";

const ERROR_LABEL_MAP: Record<HomeErrorKey, string> = {
  "current group": "current group",
  matchday: "matchday results",
  table: "table",
  groups: "groups",
  playoffs: "playoff matches",
  "next groups": "next round groups",
  "next matchday": "next round matches",
  "knockout rounds": "knockout rounds",
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
  if (round.groupName?.trim()) return round.groupName;

  if (typeof round.groupOrderID === "number") {
    return usesKnockoutLabels
      ? `Round ${round.groupOrderID}`
      : `${round.groupOrderID}. Spieltag`;
  }

  return emptyFallback;
};

export type MobileHomeRoundSection =
  | {
      key: "next-round" | "matchday";
      kicker: "Next Round" | "Matchday";
      title: string;
      subtitle: string;
      emptyText: string;
      renderKind: "matches";
      data: ApiMatch[];
    }
  | {
      key: "next-round" | "matchday";
      kicker: "Next Round" | "Matchday";
      title: string;
      subtitle: string;
      emptyText: string;
      renderKind: "ties";
      data: KnockoutTie[];
    };

export type MobileHomeTableSection = {
  key: "table";
  kicker: "Standings";
  title: "Table";
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
  const kicker: "Next Round" | "Matchday" = isNextRound ? "Next Round" : "Matchday";
  const seasonSubtitle = `Season ${state.resolvedSeason}`;
  const baseSection = {
    key,
    kicker,
    title: getRoundTitle(round, {
      usesKnockoutLabels: state.usesKnockoutLabels,
      emptyFallback: isNextRound
        ? state.usesKnockoutLabels
          ? "Next Round"
          : "Next Matchday"
        : "Latest Matchday",
    }),
    subtitle: isNextRound ? `${seasonSubtitle} · upcoming fixtures` : seasonSubtitle,
    emptyText: isNextRound
      ? "No upcoming fixtures available yet."
      : "No match results available yet for this round.",
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
        kicker: "Standings",
        title: "Table",
        subtitle: "Updated standings for the selected season.",
        emptyText: "Table data is not available yet.",
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
