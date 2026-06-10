import type {
  ApiGroup,
  ApiGroupTable,
  ApiLeague,
  ApiMatch,
  ApiTableRow,
  ApiTeam,
} from "../openligadb";

export type HomeRequestOptions = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

export type FootballDataSource = {
  getAvailableLeagues(options?: HomeRequestOptions): Promise<ApiLeague[]>;
  getAvailableLeaguesBySeason(
    season: number,
    options?: HomeRequestOptions
  ): Promise<ApiLeague[]>;
  getGroups(
    leagueShortcut: string,
    season: number,
    options?: HomeRequestOptions
  ): Promise<ApiGroup[]>;
  getCurrentGroup(
    leagueShortcut: string,
    options?: HomeRequestOptions
  ): Promise<ApiGroup>;
  getMatchdayResults(
    leagueShortcut: string,
    season: number,
    groupOrderId: number,
    options?: HomeRequestOptions
  ): Promise<ApiMatch[]>;
  getAllMatches(
    leagueShortcut: string,
    season: number,
    options?: HomeRequestOptions
  ): Promise<ApiMatch[]>;
  getMatchesByGroup(
    leagueShortcut: string,
    season: number,
    groupOrderId: number,
    options?: HomeRequestOptions
  ): Promise<ApiMatch[]>;
  getTable(
    leagueShortcut: string,
    season: number,
    options?: HomeRequestOptions
  ): Promise<ApiTableRow[]>;
  getGroupTable(
    leagueShortcut: string,
    season: number,
    options?: HomeRequestOptions
  ): Promise<ApiGroupTable[]>;
  getAvailableTeams(
    leagueShortcut: string,
    season: number,
    options?: HomeRequestOptions
  ): Promise<ApiTeam[]>;
};
