import {
  buildLeagueEntriesByGroup,
  keepLatestSeasonOnly,
  type LeagueKey,
} from "../../leagues";
import type { FootballDataSource, HomeRequestOptions } from "../data-source";
import { getStatusCode } from "./shared";

export const getGroupsWithFallback = async (
  dataSource: FootballDataSource,
  leagueKey: LeagueKey,
  leagueShortcut: string,
  season: number,
  requestOptions?: HomeRequestOptions,
) => {
  if (leagueKey !== "cl") {
    return {
      groups: await dataSource.getGroups(
        leagueShortcut,
        season,
        requestOptions,
      ),
      shortcut: leagueShortcut,
    };
  }

  try {
    return {
      groups: await dataSource.getGroups("cl", season, requestOptions),
      shortcut: "cl",
    };
  } catch (error) {
    if (getStatusCode(error) !== 404) throw error;

    return {
      groups: await dataSource.getGroups(
        leagueShortcut,
        season,
        requestOptions,
      ),
      shortcut: leagueShortcut,
    };
  }
};

export const normalizeLeagueEntries = async (
  dataSource: FootballDataSource,
  requestOptions?: HomeRequestOptions,
) => {
  const availableLeagues = await dataSource.getAvailableLeagues(requestOptions);
  const groupedLeagues = buildLeagueEntriesByGroup(availableLeagues);

  return new Map(
    Array.from(groupedLeagues.entries()).map(([key, entries]) => [
      key,
      key === "bl2" ? keepLatestSeasonOnly(entries) : entries,
    ]),
  );
};
