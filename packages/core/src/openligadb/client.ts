import type {
  ApiGroup,
  ApiGroupTable,
  ApiLeague,
  ApiMatch,
  ApiTableRow,
  ApiTeam,
  FetchOptions,
} from "./types";
import {
  OPENLIGADB_CACHE_SECONDS,
  withOpenLigaDbCache,
} from "./cache-policy";

const API_BASE = "https://api.openligadb.de";
const REQUEST_TIMEOUT_MS = 5_000;
const RETRY_DELAYS_MS = [300, 900] as const;

const getStatusCode = (error: unknown) => {
  return (error as { status?: number } | undefined)?.status;
};

const isRetryableStatus = (status: number | undefined) => {
  return status === 429 || (typeof status === "number" && status >= 500);
};

const parseRetryAfterMs = (value: string | null) => {
  if (!value) return undefined;

  const seconds = Number.parseFloat(value);
  if (!Number.isNaN(seconds)) return Math.max(0, seconds * 1_000);

  const retryAt = Date.parse(value);
  if (Number.isNaN(retryAt)) return undefined;

  return Math.max(0, retryAt - Date.now());
};

const wait = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const getRetryDelayMs = (response: Response | undefined, retryIndex: number) => {
  const retryAfterMs = parseRetryAfterMs(response?.headers.get("retry-after") ?? null);
  if (retryAfterMs !== undefined) return retryAfterMs;

  const baseDelay = RETRY_DELAYS_MS[retryIndex] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
  const jitter = Math.floor(Math.random() * 200);
  return baseDelay + jitter;
};

const createOpenLigaDbError = (status: number) => {
  const error = new Error(`OpenLigaDB-Anfrage fehlgeschlagen (${status})`);
  (error as Error & { status?: number }).status = status;
  return error;
};

const getShorterRevalidate = (
  options: FetchOptions | undefined,
  defaultRevalidate: number
) => {
  const requestedRevalidate = options?.next?.revalidate;

  return typeof requestedRevalidate === "number"
    ? Math.min(requestedRevalidate, defaultRevalidate)
    : defaultRevalidate;
};

const logRetry = ({
  attempts,
  path,
  status,
  final,
}: {
  attempts: number;
  path: string;
  status?: number;
  final: boolean;
}) => {
  if (process.env.OPENLIGADB_DIAGNOSTICS !== "1") return;
  if (attempts <= 1) return;

  const payload = { attempts, path, status };

  if (final) {
    console.warn("[OpenLigaDB] request failed after retries", payload);
    return;
  }

  console.warn("[OpenLigaDB] request recovered after retry", payload);
};

const fetchJson = async <T>(
  path: string,
  options?: FetchOptions,
  baseUrl: string = API_BASE
): Promise<T> => {
  let lastError: unknown;
  let lastStatus: number | undefined;
  let attemptsMade = 0;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    attemptsMade = attempt + 1;
    let response: Response | undefined;

    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...options,
        signal: options?.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.ok) {
        logRetry({
          attempts: attempt + 1,
          path,
          status: response.status,
          final: false,
        });
        return response.json() as Promise<T>;
      }

      lastStatus = response.status;
      lastError = createOpenLigaDbError(response.status);

      if (!isRetryableStatus(response.status) || attempt === RETRY_DELAYS_MS.length) {
        break;
      }
    } catch (error) {
      lastError = error;
      lastStatus = getStatusCode(error);

      if (!isRetryableStatus(lastStatus) || attempt === RETRY_DELAYS_MS.length) {
        break;
      }
    }

    await wait(getRetryDelayMs(response, attempt));
  }

  logRetry({
    attempts: attemptsMade,
    path,
    status: lastStatus,
    final: true,
  });

  throw lastError;
};

export const getAvailableLeagues = async (options?: FetchOptions) => {
  return fetchJson<ApiLeague[]>(
    "/getavailableleagues",
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.availableLeagues)
  );
};

export const getAvailableLeaguesBySeason = async (
  season: number,
  options?: FetchOptions
) => {
  return fetchJson<ApiLeague[]>(
    `/getavailableleagues/${season}`,
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.availableLeagues)
  );
};

export const getGroups = async (
  leagueShortcut: string,
  season: number,
  options?: FetchOptions
) => {
  return fetchJson<ApiGroup[]>(
    `/getavailablegroups/${leagueShortcut}/${season}`,
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.groups)
  );
};

export const getCurrentGroup = async (
  leagueShortcut: string,
  options?: FetchOptions
) => {
  return fetchJson<ApiGroup>(
    `/getcurrentgroup/${leagueShortcut}`,
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.currentGroup)
  );
};

export const getLastChangeDate = async (
  leagueShortcut: string,
  season: number,
  groupOrderId: number,
  options?: FetchOptions
) => {
  return fetchJson<string>(
    `/getlastchangedate/${leagueShortcut}/${season}/${groupOrderId}`,
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.liveMatchday)
  );
};

export const getMatchdayResults = async (
  leagueShortcut: string,
  season: number,
  groupOrderId: number,
  options?: FetchOptions
) => {
  return fetchJson<ApiMatch[]>(
    `/getmatchdata/${leagueShortcut}/${season}/${groupOrderId}`,
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.matchday)
  );
};

export const getAllMatches = async (
  leagueShortcut: string,
  season: number,
  options?: FetchOptions
) => {
  return fetchJson<ApiMatch[]>(
    `/getmatchdata/${leagueShortcut}/${season}`,
    withOpenLigaDbCache(
      options,
      getShorterRevalidate(options, OPENLIGADB_CACHE_SECONDS.seasonMatches)
    )
  );
};

export const getMatchById = async (matchId: number, options?: FetchOptions) => {
  return fetchJson<ApiMatch>(
    `/getmatchdata/${matchId}`,
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.liveMatchday)
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
      withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.matchday)
    );
  } catch {
    return fetchJson<ApiMatch[]>(
      `/getmatchdata/${leagueShortcut}/${season}/${groupOrderId}`,
      withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.matchday)
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
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.table)
  );
};

export const getGroupTable = async (
  leagueShortcut: string,
  season: number,
  options?: FetchOptions
) => {
  return fetchJson<ApiGroupTable[]>(
    `/getgrouptable/${leagueShortcut}/${season}`,
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.table)
  );
};

export const getAvailableTeams = async (
  leagueShortcut: string,
  season: number,
  options?: FetchOptions
) => {
  return fetchJson<ApiTeam[]>(
    `/getavailableteams/${leagueShortcut}/${season}`,
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.teams)
  );
};

export const getFinalResult = (match: ApiMatch) => {
  if (!match.matchResults || match.matchResults.length === 0) {
    return undefined;
  }

  const orderedResults = match.matchResults.filter(
    (result) => typeof result.resultOrderID === "number"
  );

  if (orderedResults.length > 0) {
    return [...orderedResults].sort(
      (a, b) => (b.resultOrderID ?? 0) - (a.resultOrderID ?? 0)
    )[0];
  }

  return (
    match.matchResults.find((result) => result.resultTypeID === 2) ??
    match.matchResults[match.matchResults.length - 1]
  );
};
