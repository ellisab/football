import {
  buildLeagueEntriesByGroup,
  buildLeagueOptions,
  getAvailableGroupKeys,
  getCurrentSeasonYear,
  getDataShortcutForLeague,
  keepLatestSeasonOnly,
  LEAGUE_GROUPS,
  pickLeagueEntryForSeason,
  resolveEffectiveLeagueShortcut,
  resolveLeagueSelection,
  resolveSeasonSelection,
  type LeagueKey,
} from "@footballleagues/core/leagues";
import {
  areAllMatchesFinished,
  findNextGroup,
  isKnockoutGroup,
  sortGoals,
} from "@footballleagues/core/matches";
import {
  getAvailableLeagues,
  getCurrentGroup,
  getGroups,
  getMatchdayResults,
  getMatchesByGroup,
  getTable,
  type ApiGroup,
  type ApiMatch,
} from "@footballleagues/core/openligadb";
import { resolveLeagueTheme } from "@footballleagues/core/teams";
import type { HomeData } from "./types";

const REVALIDATE = { next: { revalidate: 60 } };

const getGroupsWithFallback = async (
  leagueKey: LeagueKey,
  leagueShortcut: string,
  season: number
) => {
  if (leagueKey !== "cl") {
    return {
      groups: await getGroups(leagueShortcut, season, REVALIDATE),
      shortcut: leagueShortcut,
    };
  }

  try {
    return {
      groups: await getGroups("cl", season, REVALIDATE),
      shortcut: "cl",
    };
  } catch {
    return {
      groups: await getGroups(leagueShortcut, season, REVALIDATE),
      shortcut: leagueShortcut,
    };
  }
};

const ERROR_LABEL_MAP: Record<string, string> = {
  "current group": "current group",
  matchday: "matchday results",
  table: "table",
  groups: "groups",
  playoffs: "playoff matches",
  "next groups": "next round groups",
  "next matchday": "next round matches",
  "knockout rounds": "knockout rounds",
};

const getStatusCode = (error: unknown) => {
  const reason = error as { status?: number } | undefined;
  return reason?.status;
};

const normalizeLeagueEntries = async () => {
  const availableLeagues = await getAvailableLeagues(REVALIDATE);
  const groupedLeagues = buildLeagueEntriesByGroup(availableLeagues);

  return new Map(
    Array.from(groupedLeagues.entries()).map(([key, entries]) => [
      key,
      key === "bl2" ? keepLatestSeasonOnly(entries) : entries,
    ])
  );
};

export const getHomeData = async (params: {
  league?: string;
  season?: string;
}): Promise<HomeData> => {
  const normalizedGroups = await normalizeLeagueEntries();
  const availableGroupKeys = getAvailableGroupKeys(normalizedGroups);
  const resolvedLeague = resolveLeagueSelection(params.league, availableGroupKeys);

  const leagueEntries = normalizedGroups.get(resolvedLeague) ?? [];
  const resolvedSeason = resolveSeasonSelection({
    requestedSeason: params.season,
    entries: leagueEntries,
    fallbackYear: getCurrentSeasonYear(),
  });

  const entryForSeason = pickLeagueEntryForSeason(leagueEntries, resolvedSeason);
  const effectiveShortcut = resolveEffectiveLeagueShortcut(
    resolvedLeague,
    entryForSeason?.leagueShortcut
  );

  const currentGroupPromise = getCurrentGroup(effectiveShortcut, REVALIDATE);
  const tablePromise =
    resolvedLeague === "dfb"
      ? Promise.resolve([])
      : getTable(effectiveShortcut, resolvedSeason, REVALIDATE);
  const groupsPromise =
    resolvedLeague === "cl"
      ? getGroupsWithFallback(resolvedLeague, effectiveShortcut, resolvedSeason)
      : Promise.resolve({ groups: [], shortcut: effectiveShortcut });
  const playoffMatchesPromise =
    resolvedLeague === "cl"
      ? getMatchdayResults(getDataShortcutForLeague(resolvedLeague), resolvedSeason, 9, REVALIDATE)
      : Promise.resolve([]);

  const [currentGroupResult, tableResult, groupsResult, playoffResult] = await Promise.allSettled(
    [currentGroupPromise, tablePromise, groupsPromise, playoffMatchesPromise]
  );

  const dataErrors: string[] = [];

  const currentGroup =
    currentGroupResult.status === "fulfilled"
      ? currentGroupResult.value
      : (dataErrors.push("current group"), null);
  const table =
    tableResult.status === "fulfilled"
      ? tableResult.value
      : (dataErrors.push("table"), []);
  const groups =
    groupsResult.status === "fulfilled"
      ? groupsResult.value.groups
      : (() => {
          if (getStatusCode(groupsResult.reason) === 404) return [];
          dataErrors.push("groups");
          return [];
        })();
  const playoffMatches =
    playoffResult.status === "fulfilled"
      ? playoffResult.value.map(sortGoals)
      : (dataErrors.push("playoffs"), []);

  const matchdayPromise = currentGroup?.groupOrderID
    ? getMatchdayResults(
        effectiveShortcut,
        resolvedSeason,
        currentGroup.groupOrderID,
        REVALIDATE
      )
    : Promise.resolve([]);

  const [matchdayResult] = await Promise.allSettled([matchdayPromise]);

  const matches =
    matchdayResult.status === "fulfilled"
      ? matchdayResult.value.map(sortGoals)
      : (dataErrors.push("matchday"), []);

  const allCurrentRoundMatchesFinished = areAllMatchesFinished(matches);

  let nextRoundMatches: ApiMatch[] = [];
  let nextRoundLabel = "Next Matchday";

  if (currentGroup?.groupOrderID && allCurrentRoundMatchesFinished) {
    let scheduleGroups = Array.isArray(groups) ? groups : [];

    if (scheduleGroups.length === 0) {
      try {
        const fallbackGroupData = await getGroupsWithFallback(
          resolvedLeague,
          effectiveShortcut,
          resolvedSeason
        );

        scheduleGroups = Array.isArray(fallbackGroupData.groups)
          ? fallbackGroupData.groups
          : [];
      } catch (error) {
        if (getStatusCode(error) !== 404) {
          dataErrors.push("next groups");
        }
      }
    }

    const nextGroup = findNextGroup(
      scheduleGroups,
      currentGroup.groupOrderID
    );
    const fallbackNextGroupOrderID = currentGroup.groupOrderID + 1;
    const nextGroupOrderID = nextGroup?.groupOrderID ?? fallbackNextGroupOrderID;

    try {
      const nextMatchday = await getMatchdayResults(
        effectiveShortcut,
        resolvedSeason,
        nextGroupOrderID,
        REVALIDATE
      );
      nextRoundMatches = nextMatchday.map(sortGoals);
      if (nextGroup?.groupName) {
        nextRoundLabel = nextGroup.groupName;
      }
    } catch (error) {
      if (getStatusCode(error) !== 404) {
        dataErrors.push("next matchday");
      }
    }
  }

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
        REVALIDATE
      );

      return {
        group,
        matches: roundMatches.map(sortGoals),
      };
    })
  );

  const knockoutRounds = knockoutRoundResults.map((result, index) => {
    const fallbackGroup = knockoutGroups[index] as ApiGroup;

    if (result.status === "fulfilled") {
      return result.value;
    }

    dataErrors.push("knockout rounds");
    return {
      group: fallbackGroup,
      matches: [],
    };
  });

  const bracketMatches =
    playoffMatches.length > 0
      ? [
          {
            group: { groupName: "Playoffs", groupID: 9 },
            matches: playoffMatches,
          },
        ]
      : knockoutRounds;

  const leagueOptions = buildLeagueOptions({
    availableGroupKeys,
    groupedLeagues: normalizedGroups,
  });

  const activeLeagueLabel =
    leagueOptions.find((option) => option.shortcut === resolvedLeague)?.label ??
    LEAGUE_GROUPS.find((group) => group.key === resolvedLeague)?.label ??
    resolvedLeague.toUpperCase();

  const visibleErrors = Array.from(new Set(dataErrors)).map(
    (key) => ERROR_LABEL_MAP[key] ?? key
  );

  return {
    resolvedLeague,
    resolvedSeason,
    activeLeagueLabel,
    theme: resolveLeagueTheme(resolvedLeague),
    leagueOptions,
    currentGroupName: currentGroup?.groupName ?? "Latest Matchday",
    matches,
    nextRoundMatches,
    nextRoundLabel,
    showInlineTable:
      resolvedLeague === "bl1" ||
      resolvedLeague === "bl2" ||
      resolvedLeague === "fbl1" ||
      resolvedLeague === "fbl2" ||
      resolvedLeague === "cl",
    showSidebarTable:
      resolvedLeague !== "dfb" &&
      resolvedLeague !== "bl1" &&
      resolvedLeague !== "bl2" &&
      resolvedLeague !== "fbl1" &&
      resolvedLeague !== "fbl2" &&
      resolvedLeague !== "cl",
    bracketMatches,
    table,
    visibleErrors,
  };
};
