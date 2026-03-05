import { isKnockoutGroup, sortGoals } from "../../matches";
import {
  getMatchesByGroup,
  type ApiGroup,
  type ApiMatch,
  type FetchOptions,
} from "../../openligadb";
import type { BracketRound, HomeErrorKey } from "../types";

export const loadBracketMatches = async ({
  groups,
  playoffMatches,
  effectiveShortcut,
  resolvedSeason,
  fetchOptions,
}: {
  groups: ApiGroup[];
  playoffMatches: ApiMatch[];
  effectiveShortcut: string;
  resolvedSeason: number;
  fetchOptions?: FetchOptions;
}): Promise<{
  bracketMatches: BracketRound[];
  errorKeys: HomeErrorKey[];
}> => {
  const knockoutGroups = Array.isArray(groups)
    ? groups.filter((group) => isKnockoutGroup(group.groupName))
    : [];

  const knockoutRoundResults = await Promise.allSettled(
    knockoutGroups.map(async (group) => {
      if (!group.groupOrderID) return { group, matches: [] as ApiMatch[] };

      const roundMatches = await getMatchesByGroup(
        effectiveShortcut,
        resolvedSeason,
        group.groupOrderID,
        fetchOptions
      );

      return {
        group,
        matches: roundMatches.map(sortGoals),
      };
    })
  );

  const errorKeys: HomeErrorKey[] = [];
  const knockoutRounds: BracketRound[] = knockoutRoundResults.map((result, index) => {
    const fallbackGroup = knockoutGroups[index] as ApiGroup;

    if (result.status === "fulfilled") {
      return result.value;
    }

    errorKeys.push("knockout rounds");
    return {
      group: fallbackGroup,
      matches: [],
    };
  });

  return {
    bracketMatches:
      playoffMatches.length > 0
        ? [
            {
              group: { groupName: "Playoffs", groupID: 9 },
              matches: playoffMatches,
            },
          ]
        : knockoutRounds,
    errorKeys,
  };
};
