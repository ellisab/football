import {
  getDataShortcutForLeague,
  hasLeagueTable,
  type LeagueKey,
} from "../../leagues";
import {
  getCurrentGroup,
  getMatchdayResults,
  getTable,
  type ApiGroup,
  type ApiMatch,
  type ApiTableRow,
  type FetchOptions,
} from "../../openligadb";
import { sortGoals } from "../../matches";
import type { HomeErrorKey } from "../types";
import { getGroupsWithFallback } from "./league-groups";
import { getStatusCode } from "./shared";

export const loadPrimaryHomeData = async ({
  resolvedLeague,
  effectiveShortcut,
  resolvedSeason,
  fetchOptions,
}: {
  resolvedLeague: LeagueKey;
  effectiveShortcut: string;
  resolvedSeason: number;
  fetchOptions?: FetchOptions;
}): Promise<{
  currentGroup: ApiGroup | null;
  table: ApiTableRow[];
  groups: ApiGroup[];
  playoffMatches: ApiMatch[];
  errorKeys: HomeErrorKey[];
}> => {
  const currentGroupPromise = getCurrentGroup(effectiveShortcut, fetchOptions);
  const tablePromise = hasLeagueTable(resolvedLeague)
    ? getTable(effectiveShortcut, resolvedSeason, fetchOptions)
    : Promise.resolve([]);
  const groupsPromise =
    resolvedLeague === "cl"
      ? getGroupsWithFallback(
          resolvedLeague,
          effectiveShortcut,
          resolvedSeason,
          fetchOptions
        )
      : Promise.resolve({ groups: [], shortcut: effectiveShortcut });
  const playoffMatchesPromise =
    resolvedLeague === "cl"
      ? getMatchdayResults(
          getDataShortcutForLeague(resolvedLeague),
          resolvedSeason,
          9,
          fetchOptions
        )
      : Promise.resolve([]);

  const [currentGroupResult, tableResult, groupsResult, playoffResult] =
    await Promise.allSettled([
      currentGroupPromise,
      tablePromise,
      groupsPromise,
      playoffMatchesPromise,
    ]);

  const errorKeys: HomeErrorKey[] = [];

  const currentGroup =
    currentGroupResult.status === "fulfilled"
      ? currentGroupResult.value
      : (errorKeys.push("current group"), null);
  const table =
    tableResult.status === "fulfilled"
      ? tableResult.value
      : (errorKeys.push("table"), []);
  const groups =
    groupsResult.status === "fulfilled"
      ? groupsResult.value.groups
      : (() => {
          if (getStatusCode(groupsResult.reason) === 404) return [];
          errorKeys.push("groups");
          return [];
        })();
  const playoffMatches =
    playoffResult.status === "fulfilled"
      ? playoffResult.value.map(sortGoals)
      : (errorKeys.push("playoffs"), []);

  return {
    currentGroup,
    table,
    groups,
    playoffMatches,
    errorKeys,
  };
};
