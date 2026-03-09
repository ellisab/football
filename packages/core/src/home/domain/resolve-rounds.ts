import type { LeagueKey } from "../../leagues";
import {
  findNextGroup,
  getKnockoutLeg,
  getKnockoutStageName,
  hasAnyMatchResult,
  isKnockoutGroup,
  sortGoals,
  sortMatchesByKickoff,
} from "../../matches";
import { getMatchdayResults, type ApiGroup, type FetchOptions } from "../../openligadb";
import type { HomeErrorKey, HomeRoundSnapshot } from "../types";
import { getGroupsWithFallback } from "./league-groups";
import { getStatusCode, MAX_NEXT_GROUP_LOOKAHEAD } from "./shared";

const dedupeMatches = (matches: ReturnType<typeof sortMatchesByKickoff>) => {
  const seen = new Set<string>();

  return matches.filter((match) => {
    const key =
      match.matchID?.toString() ??
      `${match.team1?.teamId ?? "home"}-${match.team2?.teamId ?? "away"}-${match.matchDateTimeUTC ?? match.matchDateTime ?? "unknown"}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const getGroupNameForMatches = (
  groupOrderID: number,
  groups: ApiGroup[],
  matches: ReturnType<typeof sortMatchesByKickoff>,
  fallbackGroupName?: string
) => {
  return (
    groups.find((group) => group?.groupOrderID === groupOrderID)?.groupName ??
    matches[0]?.group?.groupName ??
    fallbackGroupName
  );
};

const buildChampionsLeagueStageSnapshot = async ({
  seedGroupOrderID,
  seedGroupName,
  seedMatches,
  groups,
  effectiveShortcut,
  resolvedSeason,
  fetchOptions,
}: {
  seedGroupOrderID: number;
  seedGroupName?: string;
  seedMatches: ReturnType<typeof sortMatchesByKickoff>;
  groups: ApiGroup[];
  effectiveShortcut: string;
  resolvedSeason: number;
  fetchOptions?: FetchOptions;
}) => {
  const stageName =
    getKnockoutStageName(seedGroupName ?? seedMatches[0]?.group?.groupName) ?? seedGroupName;
  const seedLeg = getKnockoutLeg(seedGroupName ?? seedMatches[0]?.group?.groupName);
  const knownStageGroupOrderIDs = groups
    .filter((group) => getKnockoutStageName(group?.groupName) === stageName)
    .map((group) => group.groupOrderID)
    .filter((groupOrderID): groupOrderID is number => typeof groupOrderID === "number");
  const fallbackCompanionGroupOrderIDs =
    seedLeg === "first"
      ? [seedGroupOrderID + 1]
      : seedLeg === "second"
        ? [seedGroupOrderID - 1]
        : [];
  const candidateGroupOrderIDs = Array.from(
    new Set([
      seedGroupOrderID,
      ...knownStageGroupOrderIDs,
      ...fallbackCompanionGroupOrderIDs,
    ])
  ).filter((groupOrderID) => groupOrderID > 0);
  const stageMatches = new Map<number, ReturnType<typeof sortMatchesByKickoff>>([
    [seedGroupOrderID, seedMatches],
  ]);

  for (const candidateGroupOrderID of candidateGroupOrderIDs) {
    if (candidateGroupOrderID === seedGroupOrderID) {
      continue;
    }

    try {
      const candidateMatches = sortMatchesByKickoff(
        (await getMatchdayResults(
          effectiveShortcut,
          resolvedSeason,
          candidateGroupOrderID,
          fetchOptions
        )).map(sortGoals)
      );

      if (candidateMatches.length === 0) {
        continue;
      }

      const candidateGroupName = getGroupNameForMatches(
        candidateGroupOrderID,
        groups,
        candidateMatches
      );

      if (getKnockoutStageName(candidateGroupName) !== stageName) {
        continue;
      }

      stageMatches.set(candidateGroupOrderID, candidateMatches);
    } catch (error) {
      if (getStatusCode(error) !== 404) {
        throw error;
      }
    }
  }

  const groupOrderIDs = Array.from(stageMatches.keys()).sort((a, b) => a - b);
  const matches = dedupeMatches(
    sortMatchesByKickoff(Array.from(stageMatches.values()).flat())
  );

  return {
    stageName,
    groupOrderIDs,
    snapshot: {
      groupName: stageName ?? seedGroupName,
      groupOrderID: groupOrderIDs[0] ?? seedGroupOrderID,
      matches,
    },
  };
};

const resolveChampionsLeagueRoundSnapshots = async ({
  currentGroup,
  currentRound,
  groups,
  effectiveShortcut,
  resolvedSeason,
  fetchOptions,
}: {
  currentGroup: ApiGroup;
  currentRound: HomeRoundSnapshot;
  groups: ApiGroup[];
  effectiveShortcut: string;
  resolvedSeason: number;
  fetchOptions?: FetchOptions;
}): Promise<{
  currentRound: HomeRoundSnapshot;
  nextRound: HomeRoundSnapshot;
  errorKeys: HomeErrorKey[];
}> => {
  const currentGroupOrderID = currentGroup.groupOrderID as number;
  const normalizedCurrentMatches = sortMatchesByKickoff(currentRound.matches);
  let currentMatchdayFailed = false;
  let nextMatchdayFailed = false;
  let currentStage = {
    stageName:
      getKnockoutStageName(currentGroup.groupName ?? currentRound.groupName) ??
      currentGroup.groupName ??
      currentRound.groupName,
    groupOrderIDs: [currentGroupOrderID],
    snapshot: {
      groupName:
        getKnockoutStageName(currentGroup.groupName ?? currentRound.groupName) ??
        currentGroup.groupName ??
        currentRound.groupName,
      groupOrderID: currentGroupOrderID,
      matches: normalizedCurrentMatches,
    },
  };

  try {
    currentStage = await buildChampionsLeagueStageSnapshot({
      seedGroupOrderID: currentGroupOrderID,
      seedGroupName: currentGroup.groupName ?? currentRound.groupName,
      seedMatches: normalizedCurrentMatches,
      groups,
      effectiveShortcut,
      resolvedSeason,
      fetchOptions,
    });
  } catch (error) {
    if (getStatusCode(error) !== 404) {
      currentMatchdayFailed = true;
    }
  }

  const lastCurrentStageGroupOrderID =
    currentStage.groupOrderIDs[currentStage.groupOrderIDs.length - 1] ?? currentGroupOrderID;
  const knownFutureGroupOrderIDs = groups
    .map((group) => group?.groupOrderID)
    .filter(
      (groupOrderID): groupOrderID is number =>
        typeof groupOrderID === "number" && groupOrderID > lastCurrentStageGroupOrderID
    )
    .sort((a, b) => a - b);
  const fallbackFutureGroupOrderIDs = Array.from(
    { length: MAX_NEXT_GROUP_LOOKAHEAD },
    (_, index) => lastCurrentStageGroupOrderID + index + 1
  );
  const candidateNextGroupOrderIDs = Array.from(
    new Set([...knownFutureGroupOrderIDs, ...fallbackFutureGroupOrderIDs])
  );
  let nextRound: HomeRoundSnapshot = {
    matches: [],
  };

  for (const candidateGroupOrderID of candidateNextGroupOrderIDs) {
    if (currentStage.groupOrderIDs.includes(candidateGroupOrderID)) {
      continue;
    }

    try {
      const candidateMatches = sortMatchesByKickoff(
        (await getMatchdayResults(
          effectiveShortcut,
          resolvedSeason,
          candidateGroupOrderID,
          fetchOptions
        )).map(sortGoals)
      );

      if (candidateMatches.length === 0) {
        continue;
      }

      const candidateGroupName = getGroupNameForMatches(
        candidateGroupOrderID,
        groups,
        candidateMatches
      );
      const candidateStageName = getKnockoutStageName(candidateGroupName);

      if (candidateStageName === currentStage.stageName) {
        continue;
      }

      nextRound = (
        await buildChampionsLeagueStageSnapshot({
          seedGroupOrderID: candidateGroupOrderID,
          seedGroupName: candidateGroupName,
          seedMatches: candidateMatches,
          groups,
          effectiveShortcut,
          resolvedSeason,
          fetchOptions,
        })
      ).snapshot;
      break;
    } catch (error) {
      if (getStatusCode(error) !== 404) {
        nextMatchdayFailed = true;
      }
    }
  }

  const errorKeys: HomeErrorKey[] = [];

  if (currentMatchdayFailed) {
    errorKeys.push("matchday");
  }

  if (nextRound.matches.length === 0) {
    if (nextMatchdayFailed) {
      errorKeys.push("next matchday");
    }
  }

  return {
    currentRound: currentStage.snapshot,
    nextRound,
    errorKeys,
  };
};

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
  if (resolvedLeague === "cl" && isKnockoutGroup(currentGroup.groupName)) {
    return resolveChampionsLeagueRoundSnapshots({
      currentGroup,
      currentRound,
      groups,
      effectiveShortcut,
      resolvedSeason,
      fetchOptions,
    });
  }

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
