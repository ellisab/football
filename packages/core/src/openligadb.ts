type ApiGroup = {
  groupName?: string;
  groupOrderID?: number;
  groupID?: number;
};

type ApiTeam = {
  teamId?: number;
  teamName?: string;
  shortName?: string;
  teamIconUrl?: string;
};

type ApiMatchResult = {
  resultID?: number;
  resultName?: string;
  pointsTeam1?: number;
  pointsTeam2?: number;
  resultOrderID?: number;
  resultTypeID?: number;
  resultDescription?: string;
};

type ApiGoal = {
  goalID?: number;
  scoreTeam1?: number;
  scoreTeam2?: number;
  matchMinute?: number;
  goalGetterName?: string;
  isPenalty?: boolean;
  isOwnGoal?: boolean;
  isOvertime?: boolean;
};

export type ApiMatch = {
  matchID?: number;
  matchDateTime?: string;
  matchDateTimeUTC?: string;
  leagueId?: number;
  leagueName?: string;
  leagueSeason?: number;
  leagueShortcut?: string;
  group?: ApiGroup;
  team1?: ApiTeam;
  team2?: ApiTeam;
  matchIsFinished?: boolean;
  matchResults?: ApiMatchResult[];
  goals?: ApiGoal[];
};

export type ApiLeague = {
  leagueId?: number;
  leagueName?: string;
  leagueSeason?: number;
  leagueShortcut?: string;
  sport?: {
    sportId?: number;
    sportName?: string;
  };
};

export type ApiTableRow = {
  teamInfoId?: number;
  teamName?: string;
  shortName?: string;
  teamIconUrl?: string;
  points?: number;
  opponentGoals?: number;
  goals?: number;
  matches?: number;
  won?: number;
  lost?: number;
  draw?: number;
  goalDiff?: number;
};

const API_BASE = "https://api.openligadb.de";

export type FetchOptions = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

const fetchJson = async <T>(
  path: string,
  options?: FetchOptions,
  baseUrl: string = API_BASE
): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`, options);

  if (!response.ok) {
    const error = new Error(`OpenLigaDB request failed (${response.status})`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
};

export const getAvailableLeagues = async (options?: FetchOptions) => {
  return fetchJson<ApiLeague[]>("/getavailableleagues", options);
};

export const getGroups = async (
  leagueShortcut: string,
  season: number,
  options?: FetchOptions
) => {
  return fetchJson<ApiGroup[]>(`/getgroups/${leagueShortcut}/${season}`, options);
};

export const getCurrentGroup = async (
  leagueShortcut: string,
  options?: FetchOptions
) => {
  return fetchJson<ApiGroup>(`/getcurrentgroup/${leagueShortcut}`, options);
};

export const getMatchdayResults = async (
  leagueShortcut: string,
  season: number,
  groupOrderId: number,
  options?: FetchOptions
) => {
  return fetchJson<ApiMatch[]>(
    `/getmatchdata/${leagueShortcut}/${season}/${groupOrderId}`,
    options
  );
};

export const getMatchesByGroup = async (
  leagueShortcut: string,
  season: number,
  groupOrderId: number,
  options?: FetchOptions
) => {
  try {
    return await fetchJson<ApiMatch[]>(
      `/getmatchbygroup/${leagueShortcut}/${groupOrderId}/${season}`,
      options
    );
  } catch {
    return fetchJson<ApiMatch[]>(
      `/getmatchdata/${leagueShortcut}/${season}/${groupOrderId}`,
      options
    );
  }
};

export const getTable = async (
  leagueShortcut: string,
  season: number,
  options?: FetchOptions
) => {
  return fetchJson<ApiTableRow[]>(
    `/getbltable/${leagueShortcut}/${season}`,
    options
  );
};

export const getFinalResult = (match: ApiMatch) => {
  if (!match.matchResults || match.matchResults.length === 0) {
    return undefined;
  }

  return (
    match.matchResults.find((result) => result.resultTypeID === 2) ??
    match.matchResults[match.matchResults.length - 1]
  );
};
