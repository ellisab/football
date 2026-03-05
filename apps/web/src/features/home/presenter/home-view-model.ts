import type { HomeErrorKey, HomeRoundSnapshot, HomeState } from "@footballleagues/core/home";
import { getLeagueLabel } from "@footballleagues/core/leagues";
import type { KnockoutTie } from "@footballleagues/core/matches";
import { getMatchdayNumber, getStageLabel } from "@footballleagues/core/matches";
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

export type WebHomeRoundSection =
  | {
      key: "next-round" | "matchday";
      kicker: "Next Round" | "Matchday";
      title: string;
      subtitle: string;
      emptyText: string;
      renderKind: "matches";
      items: ApiMatch[];
    }
  | {
      key: "next-round" | "matchday";
      kicker: "Next Round" | "Matchday";
      title: string;
      subtitle: string;
      emptyText: string;
      renderKind: "ties";
      items: KnockoutTie[];
    };

export type WebHomeTableSection = {
  key: "table";
  kicker: "Standings";
  title: "Table";
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
  matchdayNumber: string | null;
  stageLabel: string;
  heroKicker: string;
  featuredMatch?: ApiMatch;
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
  const kicker: "Next Round" | "Matchday" = isNextRound ? "Next Round" : "Matchday";
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
    subtitle: `${getLeagueLabel(state.resolvedLeague)} · Season ${state.resolvedSeason}`,
    emptyText: isNextRound
      ? "No upcoming fixtures available yet."
      : "No match results available yet for this round.",
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
  const currentRoundTitle = getRoundTitle(state.currentRound, {
    usesKnockoutLabels: state.usesKnockoutLabels,
    emptyFallback: "Latest Matchday",
  });
  const stageLabel = getStageLabel(currentRoundTitle);
  const matchdayNumber = getMatchdayNumber(currentRoundTitle);
  const heroKicker = matchdayNumber
    ? `Live Matchday · ${matchdayNumber}. Spieltag`
    : `Live ${stageLabel}`;

  const sections: WebHomeSection[] = state.sections.map((section) => {
    if (section.renderKind === "table") {
      return {
        key: "table",
        kicker: "Standings",
        title: "Table",
        subtitle: "Updated standings for the selected season.",
        emptyText: "Table data is not available yet.",
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
    matchdayNumber,
    stageLabel,
    heroKicker,
    featuredMatch: state.featuredMatch,
    hasTable: state.hasTable,
    bracketMatches: state.bracketMatches,
    visibleErrors: state.errorKeys.map((key) => ERROR_LABEL_MAP[key]),
    sections,
  };
};
