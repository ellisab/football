import type {
  FootballDataSource,
  HomeRequestOptions,
} from "../home/data-source";
import {
  getAvailableLeagues,
  getCurrentGroup,
  getGroups,
  getMatchdayResults,
  getMatchesByGroup,
  getTable,
} from "./client";

export const openLigaDbDataSource: FootballDataSource = {
  getAvailableLeagues(options?: HomeRequestOptions) {
    return getAvailableLeagues(options);
  },
  getGroups(
    leagueShortcut: string,
    season: number,
    options?: HomeRequestOptions,
  ) {
    return getGroups(leagueShortcut, season, options);
  },
  getCurrentGroup(leagueShortcut: string, options?: HomeRequestOptions) {
    return getCurrentGroup(leagueShortcut, options);
  },
  getMatchdayResults(
    leagueShortcut: string,
    season: number,
    groupOrderId: number,
    options?: HomeRequestOptions,
  ) {
    return getMatchdayResults(leagueShortcut, season, groupOrderId, options);
  },
  getMatchesByGroup(
    leagueShortcut: string,
    season: number,
    groupOrderId: number,
    options?: HomeRequestOptions,
  ) {
    return getMatchesByGroup(leagueShortcut, season, groupOrderId, options);
  },
  getTable(
    leagueShortcut: string,
    season: number,
    options?: HomeRequestOptions,
  ) {
    return getTable(leagueShortcut, season, options);
  },
};
