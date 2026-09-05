import {
  getCurrentSeasonYear,
  hasLeagueTable,
  isBundesligaMatchdayLeague,
  isLeagueKey,
  type LeagueKey,
  pickLeagueEntryForSeason,
  resolveEffectiveLeagueShortcut,
  resolveLeagueSelection,
  resolveSeasonSelection,
} from "../leagues";
import {
  areAllMatchesFinished,
  hasAnyMatchResult,
  sortGoals,
  sortMatchesByKickoff,
} from "../matches";
import { type ApiGroup, openLigaDbDataSource } from "../openligadb";
import type { FootballDataSource, HomeRequestOptions } from "./data-source";
import { loadBracketMatches } from "./domain/load-bracket";
import { loadPrimaryHomeData } from "./domain/load-primary-data";
import { loadMatchdayResults } from "./domain/matchday-loader";
import { resolveRoundSnapshots } from "./domain/resolve-rounds";
import { getStatusCode } from "./domain/shared";
import {
  getHomeLeagueMetadata,
  type HomeLeagueMetadata,
} from "./get-home-league-metadata";
import type { HomeErrorKey, HomeRoundSnapshot, HomeSnapshot } from "./types";

const getOrderedGroups = (groups: ApiGroup[]) => {
  return groups
    .filter((group) => typeof group?.groupOrderID === "number")
    .sort((a, b) => (a.groupOrderID as number) - (b.groupOrderID as number));
};

const getGroupName = (
  groupOrderID: number | undefined,
  groups: ApiGroup[],
  fallbackGroupName?: string,
) => {
  return (
    groups.find((group) => group?.groupOrderID === groupOrderID)?.groupName ??
    fallbackGroupName
  );
};

const loadRoundSnapshot = async ({
  dataSource,
  group,
  groups,
  effectiveShortcut,
  resolvedSeason,
  requestOptions,
}: {
  dataSource: FootballDataSource;
  group: ApiGroup;
  groups: ApiGroup[];
  effectiveShortcut: string;
  resolvedSeason: number;
  requestOptions?: HomeRequestOptions;
}): Promise<{
  round: HomeRoundSnapshot;
  failed: boolean;
  status?: number;
}> => {
  const groupOrderID = group.groupOrderID;

  if (typeof groupOrderID !== "number") {
    return {
      round: {
        groupName: group.groupName,
        matches: [],
      },
      failed: false,
      status: undefined,
    };
  }

  try {
    const matchdayResult = await loadMatchdayResults({
      dataSource,
      groupOrderId: groupOrderID,
      leagueShortcut: effectiveShortcut,
      requestOptions,
      season: resolvedSeason,
    });
    const matches = sortMatchesByKickoff(matchdayResult.matches.map(sortGoals));

    return {
      round: {
        groupName: getGroupName(groupOrderID, groups, group.groupName),
        groupOrderID,
        matches,
      },
      failed: false,
      status: undefined,
    };
  } catch (error) {
    const status = getStatusCode(error);

    return {
      round: {
        groupName: getGroupName(groupOrderID, groups, group.groupName),
        groupOrderID,
        matches: [],
      },
      failed: status !== 404,
      status,
    };
  }
};

const resolvePrimaryRoundSnapshot = async ({
  dataSource,
  resolvedLeague,
  currentGroup,
  groups,
  effectiveShortcut,
  resolvedSeason,
  referenceSeason,
  requestOptions,
}: {
  dataSource: FootballDataSource;
  resolvedLeague: LeagueKey;
  currentGroup: ApiGroup | null;
  groups: ApiGroup[];
  effectiveShortcut: string;
  resolvedSeason: number;
  referenceSeason: number;
  requestOptions?: HomeRequestOptions;
}): Promise<{
  currentGroup: ApiGroup | null;
  currentRound: HomeRoundSnapshot;
  errorKeys: HomeErrorKey[];
  rateLimited: boolean;
}> => {
  const orderedGroups = getOrderedGroups(groups);
  const currentRoundResult = currentGroup
    ? await loadRoundSnapshot({
        dataSource,
        group: currentGroup,
        groups: orderedGroups,
        effectiveShortcut,
        resolvedSeason,
        requestOptions,
      })
    : undefined;

  if (currentRoundResult?.status === 429) {
    return {
      currentGroup,
      currentRound: currentRoundResult.round,
      errorKeys: ["matchday"],
      rateLimited: true,
    };
  }

  if (isBundesligaMatchdayLeague(resolvedLeague) && orderedGroups.length > 0) {
    if (currentGroup && currentRoundResult) {
      const currentGroupOrderID = currentGroup.groupOrderID;
      const firstGroupOrderID = orderedGroups[0]?.groupOrderID;
      const currentRoundMatches = currentRoundResult.round.matches;
      const shouldTrustCurrentGroup =
        currentRoundMatches.length > 0 &&
        (areAllMatchesFinished(currentRoundMatches) ||
          hasAnyMatchResult(currentRoundMatches) ||
          currentGroupOrderID === firstGroupOrderID);

      if (shouldTrustCurrentGroup) {
        return {
          currentGroup,
          currentRound: currentRoundResult.round,
          errorKeys: currentRoundResult.failed ? ["matchday"] : [],
          rateLimited: false,
        };
      }
    }

    let firstSeasonGroupResult:
      | {
          group: ApiGroup;
          round: HomeRoundSnapshot;
        }
      | undefined;
    let latestFinishedGroupResult:
      | {
          group: ApiGroup;
          round: HomeRoundSnapshot;
        }
      | undefined;
    let matchdayFailed = false;

    for (const group of orderedGroups) {
      const roundResult =
        currentGroup?.groupOrderID === group.groupOrderID && currentRoundResult
          ? currentRoundResult
          : await loadRoundSnapshot({
              dataSource,
              group,
              groups: orderedGroups,
              effectiveShortcut,
              resolvedSeason,
              requestOptions,
            });

      matchdayFailed = matchdayFailed || roundResult.failed;

      firstSeasonGroupResult ??= {
        group,
        round: roundResult.round,
      };

      if (roundResult.status === 429) {
        const fallbackGroupResult =
          latestFinishedGroupResult ?? firstSeasonGroupResult;

        return {
          currentGroup: fallbackGroupResult?.group ?? currentGroup,
          currentRound: fallbackGroupResult?.round ??
            currentRoundResult?.round ?? { matches: [] },
          errorKeys: ["matchday"],
          rateLimited: true,
        };
      }

      if (roundResult.round.matches.length === 0) {
        continue;
      }

      if (areAllMatchesFinished(roundResult.round.matches)) {
        latestFinishedGroupResult = {
          group,
          round: roundResult.round,
        };
        continue;
      }

      if (
        hasAnyMatchResult(roundResult.round.matches) ||
        !latestFinishedGroupResult
      ) {
        return {
          currentGroup: group,
          currentRound: roundResult.round,
          errorKeys: matchdayFailed ? ["matchday"] : [],
          rateLimited: false,
        };
      }

      return {
        currentGroup: latestFinishedGroupResult.group,
        currentRound: latestFinishedGroupResult.round,
        errorKeys: matchdayFailed ? ["matchday"] : [],
        rateLimited: false,
      };
    }

    const fallbackGroupResult =
      latestFinishedGroupResult ?? firstSeasonGroupResult;

    return {
      currentGroup: fallbackGroupResult?.group ?? currentGroup,
      currentRound: fallbackGroupResult?.round ??
        currentRoundResult?.round ?? { matches: [] },
      errorKeys: matchdayFailed ? ["matchday"] : [],
      rateLimited: false,
    };
  }

  const shouldUseCurrentGroup =
    resolvedSeason === referenceSeason &&
    (currentRoundResult?.round.matches.length ?? 0) > 0;

  if (shouldUseCurrentGroup || orderedGroups.length === 0) {
    return {
      currentGroup,
      currentRound: currentRoundResult?.round ?? { matches: [] },
      errorKeys: currentRoundResult?.failed ? ["matchday"] : [],
      rateLimited: false,
    };
  }

  let firstSeasonGroupResult:
    | {
        group: ApiGroup;
        round: HomeRoundSnapshot;
      }
    | undefined;
  let matchdayFailed = false;

  for (const group of orderedGroups) {
    const roundResult =
      currentGroup?.groupOrderID === group.groupOrderID && currentRoundResult
        ? currentRoundResult
        : await loadRoundSnapshot({
            dataSource,
            group,
            groups: orderedGroups,
            effectiveShortcut,
            resolvedSeason,
            requestOptions,
          });

    matchdayFailed = matchdayFailed || roundResult.failed;

    firstSeasonGroupResult ??= {
      group,
      round: roundResult.round,
    };

    if (roundResult.status === 429) {
      return {
        currentGroup: firstSeasonGroupResult.group,
        currentRound: firstSeasonGroupResult.round,
        errorKeys: ["matchday"],
        rateLimited: true,
      };
    }

    if (roundResult.round.matches.length > 0) {
      return {
        currentGroup: group,
        currentRound: roundResult.round,
        errorKeys: matchdayFailed ? ["matchday"] : [],
        rateLimited: false,
      };
    }
  }

  return {
    currentGroup: firstSeasonGroupResult?.group ?? currentGroup,
    currentRound: firstSeasonGroupResult?.round ??
      currentRoundResult?.round ?? { matches: [] },
    errorKeys: matchdayFailed ? ["matchday"] : [],
    rateLimited: false,
  };
};

export const getHomeSnapshot = async (
  params: {
    league?: string;
    season?: string;
  },
  options?: {
    dataSource?: FootballDataSource;
    requestOptions?: HomeRequestOptions;
    fallbackYear?: number;
    leagueMetadata?: HomeLeagueMetadata;
  },
): Promise<HomeSnapshot> => {
  if (params.league && !isLeagueKey(params.league)) {
    throw new Error(`Unsupported league: ${params.league}`);
  }

  const dataSource = options?.dataSource ?? openLigaDbDataSource;
  const requestOptions = options?.requestOptions;
  const referenceSeason = options?.fallbackYear ?? getCurrentSeasonYear();
  const { groupedLeagues, availableGroupKeys, leagueOptions } =
    options?.leagueMetadata ??
    (await getHomeLeagueMetadata({ dataSource, requestOptions }));
  const resolvedLeague = resolveLeagueSelection(
    params.league,
    availableGroupKeys,
  );

  const leagueEntries = groupedLeagues.get(resolvedLeague) ?? [];
  const resolvedSeason = resolveSeasonSelection({
    requestedSeason: params.season,
    entries: leagueEntries,
    fallbackYear: referenceSeason,
  });

  const entryForSeason = pickLeagueEntryForSeason(
    leagueEntries,
    resolvedSeason,
  );
  const effectiveShortcut = resolveEffectiveLeagueShortcut(
    resolvedLeague,
    entryForSeason?.leagueShortcut,
  );

  const primaryHomeData = await loadPrimaryHomeData({
    dataSource,
    resolvedLeague,
    effectiveShortcut,
    resolvedSeason,
    requestOptions,
  });
  const dataErrors = [...primaryHomeData.errorKeys];
  const primaryRoundData = primaryHomeData.rateLimited
    ? {
        currentGroup: primaryHomeData.currentGroup,
        currentRound: { matches: [] } as HomeRoundSnapshot,
        errorKeys: [] as HomeErrorKey[],
        rateLimited: true,
      }
    : await resolvePrimaryRoundSnapshot({
        dataSource,
        resolvedLeague,
        currentGroup: primaryHomeData.currentGroup,
        groups: primaryHomeData.groups,
        effectiveShortcut,
        resolvedSeason,
        referenceSeason,
        requestOptions,
      });
  const baseCurrentRound = primaryRoundData.currentRound;

  dataErrors.push(...primaryRoundData.errorKeys);

  const roundData =
    !primaryRoundData.rateLimited && primaryRoundData.currentGroup?.groupOrderID
      ? await resolveRoundSnapshots({
          dataSource,
          currentGroup: primaryRoundData.currentGroup,
          currentRound: baseCurrentRound,
          groups: primaryHomeData.groups,
          resolvedLeague,
          effectiveShortcut,
          resolvedSeason,
          requestOptions,
        })
      : {
          currentRound: baseCurrentRound,
          nextRound: { matches: [] },
          errorKeys: [],
          rateLimited: primaryRoundData.rateLimited,
        };

  const { currentRound, nextRound, errorKeys: roundErrorKeys } = roundData;
  const {
    bracketMatches,
    errorKeys: bracketErrorKeys,
    rateLimited: bracketRateLimited,
  } = roundData.rateLimited
    ? { bracketMatches: [], errorKeys: [], rateLimited: false }
    : await loadBracketMatches({
        dataSource,
        resolvedLeague,
        currentRound,
        nextRound,
        groups: primaryHomeData.groups,
        playoffMatches: primaryHomeData.playoffMatches,
        effectiveShortcut,
        resolvedSeason,
        requestOptions,
      });

  dataErrors.push(...roundErrorKeys, ...bracketErrorKeys);

  return {
    resolvedLeague,
    resolvedSeason,
    leagueOptions,
    availableGroups: primaryHomeData.groups,
    currentRound,
    nextRound,
    hasTable: hasLeagueTable(resolvedLeague),
    bracketMatches,
    table: primaryHomeData.table,
    errorKeys: Array.from(new Set(dataErrors)),
    rateLimited:
      primaryHomeData.rateLimited ||
      roundData.rateLimited ||
      bracketRateLimited,
  };
};
