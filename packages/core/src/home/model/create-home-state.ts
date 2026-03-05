import { groupKnockoutMatchesByTie, isPlayoffRoundName } from "../../matches";
import type { HomeSnapshot } from "../types";
import type { HomeRoundSectionState, HomeSectionState, HomeState } from "./types";

const isKnockoutLeague = (leagueKey: HomeSnapshot["resolvedLeague"]) => {
  return leagueKey === "dfb" || leagueKey === "cl";
};

const buildRoundSectionState = ({
  leagueKey,
  key,
  round,
}: {
  leagueKey: HomeSnapshot["resolvedLeague"];
  key: "next-round" | "matchday";
  round: HomeSnapshot["currentRound"];
}): HomeRoundSectionState => {
  if (leagueKey === "cl") {
    return {
      key,
      round,
      renderKind: "ties",
      items: groupKnockoutMatchesByTie(round.matches),
    };
  }

  return {
    key,
    round,
    renderKind: "matches",
    items: round.matches,
  };
};

export const createHomeState = (snapshot: HomeSnapshot): HomeState => {
  const usesKnockoutLabels = isKnockoutLeague(snapshot.resolvedLeague);
  const isChampionsLeaguePlayoffRound =
    snapshot.resolvedLeague === "cl" &&
    isPlayoffRoundName(snapshot.currentRound.groupName) &&
    snapshot.bracketMatches.some((round) => isPlayoffRoundName(round.group.groupName));

  const sections: HomeSectionState[] = [];

  if (snapshot.nextRound.matches.length > 0) {
    sections.push(
      buildRoundSectionState({
        leagueKey: snapshot.resolvedLeague,
        key: "next-round",
        round: snapshot.nextRound,
      })
    );
  }

  if (!isChampionsLeaguePlayoffRound) {
    sections.push(
      buildRoundSectionState({
        leagueKey: snapshot.resolvedLeague,
        key: "matchday",
        round: snapshot.currentRound,
      })
    );
  }

  if (snapshot.hasTable) {
    sections.push({
      key: "table",
      renderKind: "table",
      items: snapshot.table,
    });
  }

  return {
    resolvedLeague: snapshot.resolvedLeague,
    resolvedSeason: snapshot.resolvedSeason,
    leagueOptions: snapshot.leagueOptions,
    currentRound: snapshot.currentRound,
    nextRound: snapshot.nextRound,
    hasTable: snapshot.hasTable,
    bracketMatches: snapshot.bracketMatches,
    table: snapshot.table,
    errorKeys: snapshot.errorKeys,
    usesKnockoutLabels,
    isChampionsLeaguePlayoffRound,
    featuredMatch: snapshot.currentRound.matches[0] ?? snapshot.nextRound.matches[0],
    sections,
  };
};
