import {
  getDataShortcutForLeague,
  hasLeagueTable,
  type LeagueKey,
} from "../../leagues";
import { sortGoals } from "../../matches";
import type { ApiGroup, ApiMatch, ApiTableRow } from "../../openligadb";
import type { FootballDataSource, HomeRequestOptions } from "../data-source";
import type { HomeErrorKey } from "../types";
import { getGroupsWithFallback } from "./league-groups";
import { loadMatchdayResults } from "./matchday-loader";
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
  rateLimited: boolean;
}> => {
  const currentGroupPromise = dataSource.getCurrentGroup(
    effectiveShortcut,
    requestOptions,
  );
  const tablePromise = hasLeagueTable(resolvedLeague)
    ? dataSource.getTable(effectiveShortcut, resolvedSeason, requestOptions)
    : Promise.resolve([]);
  const groupsPromise = getGroupsWithFallback(
    dataSource,
    resolvedLeague,
    effectiveShortcut,
    resolvedSeason,
    requestOptions,
  );
  const playoffMatchesPromise =
    resolvedLeague === "cl"
      ? loadMatchdayResults({
          dataSource,
          groupOrderId: 9,
          leagueShortcut: getDataShortcutForLeague(resolvedLeague),
          requestOptions,
          season: resolvedSeason,
        })
      : Promise.resolve({
          matches: [] as ApiMatch[],
          rateLimited: false,
          refreshFailed: false,
        });

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
      ? (() => {
          if (playoffResult.value.refreshFailed) {
            errorKeys.push("playoffs");
          }
          return playoffResult.value.matches.map(sortGoals);
        })()
      : (errorKeys.push("playoffs"), []);
  const rateLimited =
    [currentGroupResult, tableResult, groupsResult, playoffResult].some(
      (result) =>
        result.status === "rejected" && getStatusCode(result.reason) === 429,
    ) ||
    (playoffResult.status === "fulfilled" &&
      playoffResult.value.rateLimited === true);

  return {
    currentGroup,
    table,
    groups,
    playoffMatches,
    errorKeys,
    rateLimited,
  };
};
