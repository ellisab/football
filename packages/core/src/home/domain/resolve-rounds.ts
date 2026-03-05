import type { LeagueKey } from "../../leagues";
import { findNextGroup, hasAnyMatchResult, sortGoals } from "../../matches";
import { getMatchdayResults, type ApiGroup, type FetchOptions } from "../../openligadb";
import type { HomeErrorKey, HomeRoundSnapshot } from "../types";
import { getGroupsWithFallback } from "./league-groups";
import { getStatusCode, MAX_NEXT_GROUP_LOOKAHEAD } from "./shared";

export const resolveRoundSnapshots = async ({
  currentGroup,
  currentRound,
  groups,
  resolvedLeague,
  effectiveShortcut,
  resolvedSeason,
  fetchOptions,
}: {
  currentGroup: ApiGroup;
  currentRound: HomeRoundSnapshot;
  groups: ApiGroup[];
  resolvedLeague: LeagueKey;
  effectiveShortcut: string;
  resolvedSeason: number;
  fetchOptions?: FetchOptions;
}): Promise<{
  currentRound: HomeRoundSnapshot;
  nextRound: HomeRoundSnapshot;
  errorKeys: HomeErrorKey[];
}> => {
  let latestResultsRound = hasAnyMatchResult(currentRound.matches)
    ? currentRound
    : undefined;
  let nextRound: HomeRoundSnapshot = {
    matches: [],
  };
  let scheduleGroups = Array.isArray(groups) ? groups : [];
  let nextGroupsFailed = false;
  let nextMatchdayFailed = false;

  if (scheduleGroups.length === 0) {
    try {
      const fallbackGroupData = await getGroupsWithFallback(
        resolvedLeague,
        effectiveShortcut,
        resolvedSeason,
        fetchOptions
      );

      scheduleGroups = Array.isArray(fallbackGroupData.groups)
        ? fallbackGroupData.groups
        : [];
    } catch (error) {
      if (getStatusCode(error) !== 404) {
        nextGroupsFailed = true;
      }
    }
  }

  const nextGroup = findNextGroup(scheduleGroups, currentGroup.groupOrderID);
  const currentGroupOrderID = currentGroup.groupOrderID as number;
  const knownFutureGroupOrderIDs = scheduleGroups
    .map((group) => group?.groupOrderID)
    .filter(
      (groupOrderID): groupOrderID is number =>
        typeof groupOrderID === "number" &&
        groupOrderID > currentGroupOrderID
    )
    .sort((a, b) => a - b);
  const fallbackFutureGroupOrderIDs = Array.from(
    { length: MAX_NEXT_GROUP_LOOKAHEAD },
    (_, index) => currentGroupOrderID + index + 1
  );
  const candidateNextGroupOrderIDs = Array.from(
    new Set([
      ...(typeof nextGroup?.groupOrderID === "number"
        ? [nextGroup.groupOrderID]
        : []),
      ...knownFutureGroupOrderIDs,
      ...fallbackFutureGroupOrderIDs,
    ])
  );

  for (const candidateGroupOrderID of candidateNextGroupOrderIDs) {
    try {
      const nextMatchday = await getMatchdayResults(
        effectiveShortcut,
        resolvedSeason,
        candidateGroupOrderID,
        fetchOptions
      );
      const normalizedNextRound = nextMatchday.map(sortGoals);

      if (normalizedNextRound.length === 0) {
        continue;
      }

      const candidateGroup = scheduleGroups.find(
        (group) => group?.groupOrderID === candidateGroupOrderID
      );

      if (hasAnyMatchResult(normalizedNextRound)) {
        latestResultsRound = {
          groupName: candidateGroup?.groupName,
          groupOrderID: candidateGroupOrderID,
          matches: normalizedNextRound,
        };
        continue;
      }

      nextRound = {
        groupName: candidateGroup?.groupName,
        groupOrderID: candidateGroupOrderID,
        matches: normalizedNextRound,
      };
      break;
    } catch (error) {
      if (getStatusCode(error) !== 404) {
        nextMatchdayFailed = true;
      }
    }
  }

  const errorKeys: HomeErrorKey[] = [];

  if (nextRound.matches.length === 0) {
    if (nextGroupsFailed) {
      errorKeys.push("next groups");
    }
    if (nextMatchdayFailed) {
      errorKeys.push("next matchday");
    }
  }

  return {
    currentRound: latestResultsRound ?? currentRound,
    nextRound,
    errorKeys,
  };
};
