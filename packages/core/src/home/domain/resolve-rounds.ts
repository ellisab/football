import { mapSettledWithConcurrency } from "../../async";
import { isBundesligaMatchdayLeague, type LeagueKey } from "../../leagues";
import {
  areAllMatchesFinished,
  findNextGroup,
  getKnockoutLeg,
  getKnockoutStageName,
  hasAnyMatchResult,
  isKnockoutGroup,
  sortGoals,
  sortMatchesByKickoff,
} from "../../matches";
import { dedupeMatches } from "../../matches/dedupe-matches";
import type { ApiGroup } from "../../openligadb";
import type { FootballDataSource, HomeRequestOptions } from "../data-source";
import type { HomeErrorKey, HomeRoundSnapshot } from "../types";
import { getGroupsWithFallback } from "./league-groups";
import { loadMatchdayResults } from "./matchday-loader";
import { getStatusCode, MAX_NEXT_GROUP_LOOKAHEAD } from "./shared";

const getGroupNameForMatches = (
  groupOrderID: number,
  groups: ApiGroup[],
  matches: ReturnType<typeof sortMatchesByKickoff>,
  fallbackGroupName?: string,
) => {
  return (
    groups.find((group) => group?.groupOrderID === groupOrderID)?.groupName ??
    matches[0]?.group?.groupName ??
    fallbackGroupName
  );
};

const loadCandidateRounds = async ({
  dataSource,
  effectiveShortcut,
  resolvedSeason,
  candidateGroupOrderIDs,
  groups,
  requestOptions,
}: {
  dataSource: FootballDataSource;
  effectiveShortcut: string;
  resolvedSeason: number;
  candidateGroupOrderIDs: number[];
  groups: ApiGroup[];
  requestOptions?: HomeRequestOptions;
}) => {
  const settledRounds = await mapSettledWithConcurrency(
    candidateGroupOrderIDs,
    async (groupOrderID) => {
      const matchdayResult = await loadMatchdayResults({
        dataSource,
        groupOrderId: groupOrderID,
        leagueShortcut: effectiveShortcut,
        requestOptions,
        season: resolvedSeason,
      });
      const matches = sortMatchesByKickoff(
        matchdayResult.matches.map(sortGoals),
      );

      return {
        groupOrderID,
        groupName: getGroupNameForMatches(groupOrderID, groups, matches),
        matches,
        failed: false,
        rateLimited: false,
        status: undefined,
      };
    },
    {
      shouldStop: (error) => getStatusCode(error) === 429,
    },
  );

  const rounds = settledRounds.map((result) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    const status = getStatusCode(result.reason);

    return {
      groupOrderID: result.input,
      groupName: groups.find((group) => group?.groupOrderID === result.input)
        ?.groupName,
      matches: [] as ReturnType<typeof sortMatchesByKickoff>,
      failed: status !== 404,
      rateLimited: status === 429,
      status,
    };
  });

  return {
    rateLimited: rounds.some((round) => round.rateLimited),
    rounds,
  };
};

const buildChampionsLeagueStageSnapshot = async ({
  dataSource,
  seedGroupOrderID,
  seedGroupName,
  seedMatches,
  groups,
  effectiveShortcut,
  resolvedSeason,
  requestOptions,
}: {
  dataSource: FootballDataSource;
  seedGroupOrderID: number;
  seedGroupName?: string;
  seedMatches: ReturnType<typeof sortMatchesByKickoff>;
  groups: ApiGroup[];
  effectiveShortcut: string;
  resolvedSeason: number;
  requestOptions?: HomeRequestOptions;
}) => {
  const stageName =
    getKnockoutStageName(seedGroupName ?? seedMatches[0]?.group?.groupName) ??
    seedGroupName;
  const seedLeg = getKnockoutLeg(
    seedGroupName ?? seedMatches[0]?.group?.groupName,
  );
  const knownStageGroupOrderIDs = groups
    .filter((group) => getKnockoutStageName(group?.groupName) === stageName)
    .map((group) => group.groupOrderID)
    .filter(
      (groupOrderID): groupOrderID is number =>
        typeof groupOrderID === "number",
    );
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
    ]),
  ).filter((groupOrderID) => groupOrderID > 0);
  const stageMatches = new Map<number, ReturnType<typeof sortMatchesByKickoff>>(
    [[seedGroupOrderID, seedMatches]],
  );
  const companionGroupOrderIDs = candidateGroupOrderIDs.filter(
    (groupOrderID) => groupOrderID !== seedGroupOrderID,
  );

  const { rateLimited: companionRateLimited, rounds: companionRounds } =
    await loadCandidateRounds({
      dataSource,
      effectiveShortcut,
      resolvedSeason,
      candidateGroupOrderIDs: companionGroupOrderIDs,
      groups,
      requestOptions,
    });

  if (companionRounds.some((round) => round.failed)) {
    const error = new Error(
      "Champions-League-Begleitrunden konnten nicht geladen werden",
    );

    if (companionRateLimited) {
      (error as Error & { status?: number }).status = 429;
    }

    throw error;
  }

  for (const companionRound of companionRounds) {
    if (companionRound.matches.length === 0) {
      continue;
    }

    if (getKnockoutStageName(companionRound.groupName) !== stageName) {
      continue;
    }

    stageMatches.set(companionRound.groupOrderID, companionRound.matches);
  }

  const groupOrderIDs = Array.from(stageMatches.keys()).sort((a, b) => a - b);
  const matches = dedupeMatches(
    sortMatchesByKickoff(Array.from(stageMatches.values()).flat()),
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
  dataSource,
  currentGroup,
  currentRound,
  groups,
  effectiveShortcut,
  resolvedSeason,
  requestOptions,
}: {
  dataSource: FootballDataSource;
  currentGroup: ApiGroup;
  currentRound: HomeRoundSnapshot;
  groups: ApiGroup[];
  effectiveShortcut: string;
  resolvedSeason: number;
  requestOptions?: HomeRequestOptions;
}): Promise<{
  currentRound: HomeRoundSnapshot;
  nextRound: HomeRoundSnapshot;
  errorKeys: HomeErrorKey[];
  rateLimited: boolean;
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
        getKnockoutStageName(
          currentGroup.groupName ?? currentRound.groupName,
        ) ??
        currentGroup.groupName ??
        currentRound.groupName,
      groupOrderID: currentGroupOrderID,
      matches: normalizedCurrentMatches,
    },
  };

  try {
    currentStage = await buildChampionsLeagueStageSnapshot({
      dataSource,
      seedGroupOrderID: currentGroupOrderID,
      seedGroupName: currentGroup.groupName ?? currentRound.groupName,
      seedMatches: normalizedCurrentMatches,
      groups,
      effectiveShortcut,
      resolvedSeason,
      requestOptions,
    });
  } catch (error) {
    if (getStatusCode(error) !== 404) {
      currentMatchdayFailed = true;
    }

    if (getStatusCode(error) === 429) {
      return {
        currentRound: currentStage.snapshot,
        nextRound: { matches: [] },
        errorKeys: ["matchday"],
        rateLimited: true,
      };
    }
  }

  const lastCurrentStageGroupOrderID =
    currentStage.groupOrderIDs[currentStage.groupOrderIDs.length - 1] ??
    currentGroupOrderID;
  const knownFutureGroupOrderIDs = groups
    .map((group) => group?.groupOrderID)
    .filter(
      (groupOrderID): groupOrderID is number =>
        typeof groupOrderID === "number" &&
        groupOrderID > lastCurrentStageGroupOrderID,
    )
    .sort((a, b) => a - b);
  const fallbackFutureGroupOrderIDs = Array.from(
    { length: MAX_NEXT_GROUP_LOOKAHEAD },
    (_, index) => lastCurrentStageGroupOrderID + index + 1,
  );
  const candidateNextGroupOrderIDs = Array.from(
    new Set([...knownFutureGroupOrderIDs, ...fallbackFutureGroupOrderIDs]),
  ).filter(
    (groupOrderID) => !currentStage.groupOrderIDs.includes(groupOrderID),
  );
  let nextRound: HomeRoundSnapshot = {
    matches: [],
  };

  const { rateLimited: candidateRateLimited, rounds: candidateRounds } =
    await loadCandidateRounds({
      dataSource,
      effectiveShortcut,
      resolvedSeason,
      candidateGroupOrderIDs: candidateNextGroupOrderIDs,
      groups,
      requestOptions,
    });

  if (candidateRateLimited) {
    return {
      currentRound: currentStage.snapshot,
      nextRound,
      errorKeys: [
        ...(currentMatchdayFailed ? (["matchday"] as HomeErrorKey[]) : []),
        "next matchday",
      ],
      rateLimited: true,
    };
  }

  let rateLimited = false;

  for (const candidateRound of candidateRounds) {
    if (candidateRound.failed) {
      nextMatchdayFailed = true;
      continue;
    }

    if (candidateRound.matches.length === 0) {
      continue;
    }

    const candidateStageName = getKnockoutStageName(candidateRound.groupName);

    if (candidateStageName === currentStage.stageName) {
      continue;
    }

    try {
      nextRound = (
        await buildChampionsLeagueStageSnapshot({
          dataSource,
          seedGroupOrderID: candidateRound.groupOrderID,
          seedGroupName: candidateRound.groupName,
          seedMatches: candidateRound.matches,
          groups,
          effectiveShortcut,
          resolvedSeason,
          requestOptions,
        })
      ).snapshot;
    } catch (error) {
      if (getStatusCode(error) !== 404) {
        nextMatchdayFailed = true;
      }

      if (getStatusCode(error) === 429) {
        rateLimited = true;
        break;
      }
    }

    if (nextRound.matches.length > 0) {
      break;
    }
  }

  const errorKeys: HomeErrorKey[] = [];

  if (currentMatchdayFailed) {
    errorKeys.push("matchday");
  }

  if (nextMatchdayFailed || rateLimited) {
    errorKeys.push("next matchday");
  }

  return {
    currentRound: currentStage.snapshot,
    nextRound,
    errorKeys,
    rateLimited,
  };
};

export const resolveRoundSnapshots = async ({
  dataSource,
  currentGroup,
  currentRound,
  groups,
  resolvedLeague,
  effectiveShortcut,
  resolvedSeason,
  requestOptions,
}: {
  dataSource: FootballDataSource;
  currentGroup: ApiGroup;
  currentRound: HomeRoundSnapshot;
  groups: ApiGroup[];
  resolvedLeague: LeagueKey;
  effectiveShortcut: string;
  resolvedSeason: number;
  requestOptions?: HomeRequestOptions;
}): Promise<{
  currentRound: HomeRoundSnapshot;
  nextRound: HomeRoundSnapshot;
  errorKeys: HomeErrorKey[];
  rateLimited: boolean;
}> => {
  if (resolvedLeague === "cl" && isKnockoutGroup(currentGroup.groupName)) {
    return resolveChampionsLeagueRoundSnapshots({
      dataSource,
      currentGroup,
      currentRound,
      groups,
      effectiveShortcut,
      resolvedSeason,
      requestOptions,
    });
  }

  const orderedGroupOrderIDs = groups
    .map((group) => group?.groupOrderID)
    .filter(
      (groupOrderID): groupOrderID is number =>
        typeof groupOrderID === "number",
    )
    .sort((a, b) => a - b);
  const initialGroupOrderID = currentGroup.groupOrderID as number | undefined;

  if (
    currentRound.matches.length === 0 &&
    initialGroupOrderID === orderedGroupOrderIDs[0]
  ) {
    return {
      currentRound,
      nextRound: { matches: [] },
      errorKeys: [],
      rateLimited: false,
    };
  }

  if (
    isBundesligaMatchdayLeague(resolvedLeague) &&
    !areAllMatchesFinished(currentRound.matches)
  ) {
    return {
      currentRound,
      nextRound: { matches: [] },
      errorKeys: [],
      rateLimited: false,
    };
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
        dataSource,
        resolvedLeague,
        effectiveShortcut,
        resolvedSeason,
        requestOptions,
      );

      scheduleGroups = Array.isArray(fallbackGroupData.groups)
        ? fallbackGroupData.groups
        : [];
    } catch (error) {
      if (getStatusCode(error) !== 404) {
        nextGroupsFailed = true;
      }

      if (getStatusCode(error) === 429) {
        return {
          currentRound: latestResultsRound ?? currentRound,
          nextRound,
          errorKeys: ["next groups"],
          rateLimited: true,
        };
      }
    }
  }

  const nextGroup = findNextGroup(scheduleGroups, currentGroup.groupOrderID);
  const currentGroupOrderID = currentGroup.groupOrderID as number;
  const knownFutureGroupOrderIDs = scheduleGroups
    .map((group) => group?.groupOrderID)
    .filter(
      (groupOrderID): groupOrderID is number =>
        typeof groupOrderID === "number" && groupOrderID > currentGroupOrderID,
    )
    .sort((a, b) => a - b);
  const fallbackFutureGroupOrderIDs = Array.from(
    { length: MAX_NEXT_GROUP_LOOKAHEAD },
    (_, index) => currentGroupOrderID + index + 1,
  );
  const candidateNextGroupOrderIDs = Array.from(
    new Set([
      ...(typeof nextGroup?.groupOrderID === "number"
        ? [nextGroup.groupOrderID]
        : []),
      ...knownFutureGroupOrderIDs,
      ...fallbackFutureGroupOrderIDs,
    ]),
  );

  const { rateLimited: candidateRateLimited, rounds: candidateRounds } =
    await loadCandidateRounds({
      dataSource,
      effectiveShortcut,
      resolvedSeason,
      candidateGroupOrderIDs: candidateNextGroupOrderIDs,
      groups: scheduleGroups,
      requestOptions,
    });

  for (const candidateRound of candidateRounds) {
    if (candidateRound.failed) {
      nextMatchdayFailed = true;
      continue;
    }

    if (candidateRound.matches.length === 0) {
      continue;
    }

    if (isBundesligaMatchdayLeague(resolvedLeague)) {
      if (areAllMatchesFinished(candidateRound.matches)) {
        latestResultsRound = {
          groupName: candidateRound.groupName,
          groupOrderID: candidateRound.groupOrderID,
          matches: candidateRound.matches,
        };
        continue;
      }

      nextRound = {
        groupName: candidateRound.groupName,
        groupOrderID: candidateRound.groupOrderID,
        matches: candidateRound.matches,
      };
      break;
    }

    if (hasAnyMatchResult(candidateRound.matches)) {
      latestResultsRound = {
        groupName: candidateRound.groupName,
        groupOrderID: candidateRound.groupOrderID,
        matches: candidateRound.matches,
      };
      continue;
    }

    nextRound = {
      groupName: candidateRound.groupName,
      groupOrderID: candidateRound.groupOrderID,
      matches: candidateRound.matches,
    };
    break;
  }

  const errorKeys: HomeErrorKey[] = [];

  if (nextGroupsFailed) {
    errorKeys.push("next groups");
  }
  if (nextMatchdayFailed || candidateRateLimited) {
    errorKeys.push("next matchday");
  }

  return {
    currentRound: latestResultsRound ?? currentRound,
    nextRound,
    errorKeys,
    rateLimited: candidateRateLimited,
  };
};
