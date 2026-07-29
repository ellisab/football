import type { ApiGroup, ApiLeague, ApiMatch, ApiTableRow } from "../openligadb";

export type HomeRequestOptions = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

export type FootballDataSource = {
  getAvailableLeagues(options?: HomeRequestOptions): Promise<ApiLeague[]>;
  getGroups(
    leagueShortcut: string,
    season: number,
    options?: HomeRequestOptions,
  ): Promise<ApiGroup[]>;
  getCurrentGroup(
    leagueShortcut: string,
    options?: HomeRequestOptions,
  ): Promise<ApiGroup>;
  getLastChangeDate(
    leagueShortcut: string,
    season: number,
    groupOrderId: number,
    options?: HomeRequestOptions,
  ): Promise<string>;
  getMatchdayResults(
    leagueShortcut: string,
    season: number,
    groupOrderId: number,
    options?: HomeRequestOptions,
  ): Promise<ApiMatch[]>;
  getMatchesByGroup(
    leagueShortcut: string,
    season: number,
    groupOrderId: number,
    options?: HomeRequestOptions,
  ): Promise<ApiMatch[]>;
  getTable(
    leagueShortcut: string,
    season: number,
    options?: HomeRequestOptions,
  ): Promise<ApiTableRow[]>;
};
