import {
  buildLeagueEntriesByGroup,
  keepLatestSeasonOnly,
  type LeagueKey,
} from "../../leagues";
import { getAvailableLeagues, getGroups, type FetchOptions } from "../../openligadb";

export const getGroupsWithFallback = async (
  leagueKey: LeagueKey,
  leagueShortcut: string,
  season: number,
  fetchOptions?: FetchOptions
) => {
  if (leagueKey !== "cl") {
    return {
      groups: await getGroups(leagueShortcut, season, fetchOptions),
      shortcut: leagueShortcut,
    };
  }

  try {
    return {
      groups: await getGroups("cl", season, fetchOptions),
      shortcut: "cl",
    };
  } catch {
    return {
      groups: await getGroups(leagueShortcut, season, fetchOptions),
      shortcut: leagueShortcut,
    };
  }
};

export const normalizeLeagueEntries = async (fetchOptions?: FetchOptions) => {
  const availableLeagues = await getAvailableLeagues(fetchOptions);
  const groupedLeagues = buildLeagueEntriesByGroup(availableLeagues);

  return new Map(
    Array.from(groupedLeagues.entries()).map(([key, entries]) => [
      key,
      key === "bl2" ? keepLatestSeasonOnly(entries) : entries,
    ])
  );
};
