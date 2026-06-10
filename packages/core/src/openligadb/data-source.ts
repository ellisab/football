import type { FootballDataSource, HomeRequestOptions } from "../home/data-source";
import {
  getAvailableLeagues,
  getAvailableLeaguesBySeason,
  getAllMatches,
  getAvailableTeams,
  getCurrentGroup,
  getGroupTable,
  getGroups,
  getMatchdayResults,
  getMatchesByGroup,
  getTable,
} from "./client";

export const openLigaDbDataSource: FootballDataSource = {
  getAvailableLeagues(options?: HomeRequestOptions) {
    return getAvailableLeagues(options);
  },
  getAvailableLeaguesBySeason(season: number, options?: HomeRequestOptions) {
    return getAvailableLeaguesBySeason(season, options);
  },
  getGroups(leagueShortcut: string, season: number, options?: HomeRequestOptions) {
    return getGroups(leagueShortcut, season, options);
  },
  getCurrentGroup(leagueShortcut: string, options?: HomeRequestOptions) {
    return getCurrentGroup(leagueShortcut, options);
  },
  getMatchdayResults(
    leagueShortcut: string,
    season: number,
    groupOrderId: number,
    options?: HomeRequestOptions
  ) {
    return getMatchdayResults(leagueShortcut, season, groupOrderId, options);
  },
  getAllMatches(leagueShortcut: string, season: number, options?: HomeRequestOptions) {
    return getAllMatches(leagueShortcut, season, options);
  },
  getMatchesByGroup(
    leagueShortcut: string,
    season: number,
    groupOrderId: number,
    options?: HomeRequestOptions
  ) {
    return getMatchesByGroup(leagueShortcut, season, groupOrderId, options);
  },
  getTable(leagueShortcut: string, season: number, options?: HomeRequestOptions) {
    return getTable(leagueShortcut, season, options);
  },
  getGroupTable(
    leagueShortcut: string,
    season: number,
    options?: HomeRequestOptions
  ) {
    return getGroupTable(leagueShortcut, season, options);
  },
  getAvailableTeams(
    leagueShortcut: string,
    season: number,
    options?: HomeRequestOptions
  ) {
    return getAvailableTeams(leagueShortcut, season, options);
  },
};
