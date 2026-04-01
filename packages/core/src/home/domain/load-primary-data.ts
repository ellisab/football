import {
  getDataShortcutForLeague,
  hasLeagueTable,
  type LeagueKey,
} from "../../leagues";
import type { ApiGroup, ApiMatch, ApiTableRow } from "../../openligadb";
import { sortGoals } from "../../matches";
import type { HomeErrorKey } from "../types";
import type { FootballDataSource, HomeRequestOptions } from "../data-source";
import { getGroupsWithFallback } from "./league-groups";
import { getStatusCode } from "./shared";

export const loadPrimaryHomeData = async ({
  dataSource,
  resolvedLeague,
  effectiveShortcut,
  resolvedSeason,
  requestOptions,
}: {
  dataSource: FootballDataSource;
  resolvedLeague: LeagueKey;
  effectiveShortcut: string;
  resolvedSeason: number;
  requestOptions?: HomeRequestOptions;
}): Promise<{
  currentGroup: ApiGroup | null;
  table: ApiTableRow[];
  groups: ApiGroup[];
  playoffMatches: ApiMatch[];
  errorKeys: HomeErrorKey[];
}> => {
  const currentGroupPromise = dataSource.getCurrentGroup(
    effectiveShortcut,
    requestOptions
  );
  const tablePromise = hasLeagueTable(resolvedLeague)
    ? dataSource.getTable(effectiveShortcut, resolvedSeason, requestOptions)
    : Promise.resolve([]);
  const groupsPromise = getGroupsWithFallback(
    dataSource,
    resolvedLeague,
    effectiveShortcut,
    resolvedSeason,
    requestOptions
  );
  const playoffMatchesPromise =
    resolvedLeague === "cl"
      ? dataSource.getMatchdayResults(
          getDataShortcutForLeague(resolvedLeague),
          resolvedSeason,
          9,
          requestOptions
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
