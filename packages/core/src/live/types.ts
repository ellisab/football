import type { LeagueKey } from "../leagues";
import type { ApiLeague, ApiMatch, FetchOptions } from "../openligadb";

export type LiveDataSource = {
  getAvailableLeaguesBySeason(
    season: number,
    options?: FetchOptions
  ): Promise<ApiLeague[]>;
  getAllMatches(
    leagueShortcut: string,
    season: number,
    options?: FetchOptions
  ): Promise<ApiMatch[]>;
};

export type LiveScheduleMatch = {
  league: LeagueKey;
  season: number;
  effectiveShortcut: string;
  match: ApiMatch;
};

export type LiveScheduleResult = {
  matches: LiveScheduleMatch[];
  failedLeagues: LeagueKey[];
  checkedAt: number;
};

export type GetLiveScheduleOptions = {
  dataSource?: LiveDataSource;
  now?: Date;
  requestTimeoutMs?: number;
};
