import {
  buildLeagueOptions,
  getAvailableGroupKeys,
  getCurrentSeasonYear,
  hasLeagueTable,
  isBundesligaMatchdayLeague,
  pickLeagueEntryForSeason,
  resolveEffectiveLeagueShortcut,
  resolveLeagueSelection,
  resolveSeasonSelection,
  type LeagueKey,
} from "../leagues";
import {
  areAllMatchesFinished,
  hasAnyMatchResult,
  sortGoals,
  sortMatchesByKickoff,
} from "../matches";
import { openLigaDbDataSource, type ApiGroup } from "../openligadb";
import { WORLD_CUP_LEAGUE_KEY, WORLD_CUP_SEASON } from "../world-cup";
import type { FootballDataSource, HomeRequestOptions } from "./data-source";
import { loadBracketMatches } from "./domain/load-bracket";
import { loadPrimaryHomeData } from "./domain/load-primary-data";
import { normalizeLeagueEntries } from "./domain/league-groups";
import { resolveRoundSnapshots } from "./domain/resolve-rounds";
import { getStatusCode } from "./domain/shared";
import type { HomeErrorKey, HomeRoundSnapshot, HomeSnapshot } from "./types";

const getOrderedGroups = (groups: ApiGroup[]) => {
  return groups
    .filter((group) => typeof group?.groupOrderID === "number")
    .sort((a, b) => (a.groupOrderID as number) - (b.groupOrderID as number));
};

const getGroupName = (
  groupOrderID: number | undefined,
  groups: ApiGroup[],
  fallbackGroupName?: string
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
}> => {
  const groupOrderID = group.groupOrderID;

  if (typeof groupOrderID !== "number") {
    return {
      round: {
        groupName: group.groupName,
        matches: [],
      },
      failed: false,
    };
  }

  try {
    const matches = sortMatchesByKickoff(
      (
        await dataSource.getMatchdayResults(
          effectiveShortcut,
          resolvedSeason,
          groupOrderID,
          requestOptions
        )
      ).map(sortGoals)
    );

    return {
      round: {
        groupName: getGroupName(groupOrderID, groups, group.groupName),
        groupOrderID,
        matches,
      },
      failed: false,
    };
  } catch (error) {
    return {
      round: {
        groupName: getGroupName(groupOrderID, groups, group.groupName),
        groupOrderID,
        matches: [],
      },
      failed: getStatusCode(error) !== 404,
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

  if (isBundesligaMatchdayLeague(resolvedLeague) && orderedGroups.length > 0) {
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
        };
      }

      return {
        currentGroup: latestFinishedGroupResult.group,
        currentRound: latestFinishedGroupResult.round,
        errorKeys: matchdayFailed ? ["matchday"] : [],
      };
    }

    const fallbackGroupResult =
      latestFinishedGroupResult ?? firstSeasonGroupResult;

    return {
      currentGroup: fallbackGroupResult?.group ?? currentGroup,
      currentRound:
        fallbackGroupResult?.round ?? currentRoundResult?.round ?? { matches: [] },
      errorKeys: matchdayFailed ? ["matchday"] : [],
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

    if (roundResult.round.matches.length > 0) {
      return {
        currentGroup: group,
        currentRound: roundResult.round,
        errorKeys: [],
      };
    }
  }

  return {
    currentGroup: firstSeasonGroupResult?.group ?? currentGroup,
    currentRound:
      firstSeasonGroupResult?.round ?? currentRoundResult?.round ?? { matches: [] },
    errorKeys: matchdayFailed ? ["matchday"] : [],
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
  }
): Promise<HomeSnapshot> => {
  const dataSource = options?.dataSource ?? openLigaDbDataSource;
  const requestOptions = options?.requestOptions;
  const referenceSeason = options?.fallbackYear ?? getCurrentSeasonYear();
  const normalizedGroups = await normalizeLeagueEntries(dataSource, requestOptions);
  const availableGroupKeys = Array.from(
    new Set([...getAvailableGroupKeys(normalizedGroups), WORLD_CUP_LEAGUE_KEY])
  );
  const resolvedLeague = resolveLeagueSelection(params.league, availableGroupKeys);

  if (resolvedLeague === WORLD_CUP_LEAGUE_KEY) {
    return {
      resolvedLeague,
      resolvedSeason: WORLD_CUP_SEASON,
      leagueOptions: buildLeagueOptions({
        availableGroupKeys,
        groupedLeagues: normalizedGroups,
        seasonOverrides: {
          [WORLD_CUP_LEAGUE_KEY]: WORLD_CUP_SEASON,
        },
      }),
      currentRound: { matches: [] },
      nextRound: { matches: [] },
      hasTable: false,
      bracketMatches: [],
      table: [],
      errorKeys: [],
    };
  }

  const leagueEntries = normalizedGroups.get(resolvedLeague) ?? [];
  const resolvedSeason = resolveSeasonSelection({
    requestedSeason: params.season,
    entries: leagueEntries,
    fallbackYear: referenceSeason,
  });

  const entryForSeason = pickLeagueEntryForSeason(leagueEntries, resolvedSeason);
  const effectiveShortcut = resolveEffectiveLeagueShortcut(
    resolvedLeague,
    entryForSeason?.leagueShortcut
  );

  const primaryHomeData = await loadPrimaryHomeData({
    dataSource,
    resolvedLeague,
    effectiveShortcut,
    resolvedSeason,
    requestOptions,
  });
  const dataErrors = [...primaryHomeData.errorKeys];
  const primaryRoundData = await resolvePrimaryRoundSnapshot({
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

  const { currentRound, nextRound, errorKeys: roundErrorKeys } =
    primaryRoundData.currentGroup?.groupOrderID
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
        };

  const { bracketMatches, errorKeys: bracketErrorKeys } = await loadBracketMatches({
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

  const leagueOptions = buildLeagueOptions({
    availableGroupKeys,
    groupedLeagues: normalizedGroups,
    seasonOverrides: {
      [WORLD_CUP_LEAGUE_KEY]: WORLD_CUP_SEASON,
    },
  });

  return {
    resolvedLeague,
    resolvedSeason,
    leagueOptions,
    currentRound,
    nextRound,
    hasTable: hasLeagueTable(resolvedLeague),
    bracketMatches,
    table: primaryHomeData.table,
    errorKeys: Array.from(new Set(dataErrors)),
  };
};
