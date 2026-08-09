import { OPENLIGADB_CACHE_SECONDS, withOpenLigaDbCache } from "./cache-policy";
import type {
  ApiGroup,
  ApiLeague,
  ApiMatch,
  ApiTableRow,
  ApiTeam,
  FetchOptions,
} from "./types";

const API_BASE = "https://api.openligadb.de";
const REQUEST_TIMEOUT_MS = 5_000;
const RETRY_DELAYS_MS = [300, 900] as const;
const MAX_RETRY_AFTER_MS = 2_000;
const inFlightGetRequests = new Map<string, Promise<unknown>>();
const endpointCooldowns = new Map<
  string,
  { expiresAt: number; status: number }
>();

const getStatusCode = (error: unknown) => {
  return (error as { status?: number } | undefined)?.status;
};

const isRetryableStatus = (status: number | undefined) => {
  return status === 429 || (typeof status === "number" && status >= 500);
};

const parseRetryAfterMs = (value: string | null) => {
  if (!value) return undefined;

  const seconds = Number.parseFloat(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);

  const retryAt = Date.parse(value);
  if (Number.isNaN(retryAt)) return undefined;

  return Math.max(0, retryAt - Date.now());
};

const wait = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const getRetryDelayMs = (
  response: Response | undefined,
  retryIndex: number,
) => {
  const retryAfterMs = parseRetryAfterMs(
    response?.headers.get("retry-after") ?? null,
  );
  if (retryAfterMs !== undefined) return retryAfterMs;

  const baseDelay =
    RETRY_DELAYS_MS[retryIndex] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
  const jitter = Math.floor(Math.random() * 200);
  return baseDelay + jitter;
};

const getEndpointKey = (baseUrl: string, path: string) => `${baseUrl}${path}`;

const pruneCooldowns = (
  cooldowns: Map<string, { expiresAt: number; status: number }>,
  now: number,
) => {
  for (const [key, cooldown] of cooldowns) {
    if (cooldown.expiresAt <= now) cooldowns.delete(key);
  }
};

const getActiveCooldown = (endpointKey: string) => {
  const now = Date.now();

  pruneCooldowns(endpointCooldowns, now);

  return endpointCooldowns.get(endpointKey);
};

const getSingleFlightKey = (
  endpointKey: string,
  options: FetchOptions | undefined,
) => {
  const method = options?.method?.toUpperCase() ?? "GET";
  if (method !== "GET") return undefined;

  const safeOptionKeys = new Set(["cache", "method", "next"]);
  if (options && Object.keys(options).some((key) => !safeOptionKeys.has(key))) {
    return undefined;
  }

  const safeNextKeys = new Set(["revalidate", "tags"]);
  if (
    options?.next &&
    Object.keys(options.next).some((key) => !safeNextKeys.has(key))
  ) {
    return undefined;
  }

  return JSON.stringify({
    endpointKey,
    cache: options?.cache ?? null,
    revalidate: options?.next?.revalidate ?? null,
    tags: options?.next?.tags ? [...options.next.tags].sort() : [],
  });
};

const createOpenLigaDbError = (status: number, retryAfterMs?: number) => {
  const error = new Error(`OpenLigaDB-Anfrage fehlgeschlagen (${status})`);
  const failure = error as Error & {
    retryAfterMs?: number;
    status?: number;
  };
  failure.status = status;
  if (retryAfterMs !== undefined) failure.retryAfterMs = retryAfterMs;
  return error;
};

const getShorterRevalidate = (
  options: FetchOptions | undefined,
  defaultRevalidate: number,
) => {
  const requestedRevalidate = options?.next?.revalidate;

  return typeof requestedRevalidate === "number" &&
    Number.isFinite(requestedRevalidate) &&
    requestedRevalidate > 0
    ? Math.min(requestedRevalidate, defaultRevalidate)
    : defaultRevalidate;
};

const getErrorName = (error: unknown) => {
  if (error instanceof Error && error.name) return error.name;
  return "UnknownError";
};

const classifyFailure = (
  error: unknown,
  status: number | undefined,
): "http" | "timeout" | "network" => {
  if (typeof status === "number") return "http";

  const errorName = getErrorName(error);
  return errorName === "AbortError" || errorName === "TimeoutError"
    ? "timeout"
    : "network";
};

const logRecoveredRetry = ({
  attempts,
  path,
  status,
}: {
  attempts: number;
  path: string;
  status?: number;
}) => {
  if (process.env.OPENLIGADB_DIAGNOSTICS !== "1") return;
  if (attempts <= 1) return;

  console.warn({
    event: "openligadb.request.recovered",
    attempts,
    path,
    status: status ?? null,
  });
};

const logTerminalFailure = ({
  attempts,
  duration,
  error,
  path,
  status,
}: {
  attempts: number;
  duration: number;
  error: unknown;
  path: string;
  status?: number;
}) => {
  if (
    (status === 404 || attempts === 0) &&
    process.env.OPENLIGADB_DIAGNOSTICS !== "1"
  ) {
    return;
  }

  console.warn({
    event: "openligadb.request.failed",
    path,
    duration,
    attempts,
    status: status ?? null,
    errorName: getErrorName(error),
    classification: classifyFailure(error, status),
  });
};

const executeFetchJson = async <T>(
  path: string,
  options?: FetchOptions,
  baseUrl: string = API_BASE,
): Promise<T> => {
  const startedAt = Date.now();
  const endpointKey = getEndpointKey(baseUrl, path);
  const cooldown = getActiveCooldown(endpointKey);

  if (cooldown) {
    const error = createOpenLigaDbError(
      cooldown.status,
      Math.max(0, cooldown.expiresAt - Date.now()),
    );
    logTerminalFailure({
      attempts: 0,
      duration: Date.now() - startedAt,
      error,
      path,
      status: cooldown.status,
    });
    throw error;
  }

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
        const data = (await response.json()) as T;
        logRecoveredRetry({
          attempts: attempt + 1,
          path,
          status: response.status,
        });
        return data;
      }

      lastStatus = response.status;
      const retryAfterMs = parseRetryAfterMs(
        response.headers.get("retry-after"),
      );
      lastError = createOpenLigaDbError(response.status, retryAfterMs);

      if (!isRetryableStatus(response.status)) break;

      if (retryAfterMs !== undefined && retryAfterMs > MAX_RETRY_AFTER_MS) {
        const existingCooldown = endpointCooldowns.get(endpointKey);

        endpointCooldowns.set(endpointKey, {
          expiresAt: Math.max(
            existingCooldown?.expiresAt ?? 0,
            Date.now() + retryAfterMs,
          ),
          status: response.status,
        });
        break;
      }

      if (attempt === RETRY_DELAYS_MS.length) break;
    } catch (error) {
      lastError = error;
      lastStatus = getStatusCode(error);

      if (
        !isRetryableStatus(lastStatus) ||
        attempt === RETRY_DELAYS_MS.length
      ) {
        break;
      }
    }

    await wait(getRetryDelayMs(response, attempt));
  }

  logTerminalFailure({
    attempts: attemptsMade,
    duration: Date.now() - startedAt,
    error: lastError,
    path,
    status: lastStatus,
  });

  throw lastError;
};

const fetchJson = <T>(
  path: string,
  options?: FetchOptions,
  baseUrl: string = API_BASE,
): Promise<T> => {
  const endpointKey = getEndpointKey(baseUrl, path);
  const requestKey = getSingleFlightKey(endpointKey, options);
  if (!requestKey) return executeFetchJson<T>(path, options, baseUrl);

  const existingRequest = inFlightGetRequests.get(requestKey);
  if (existingRequest) return existingRequest as Promise<T>;

  const request = executeFetchJson<T>(path, options, baseUrl).finally(() => {
    if (inFlightGetRequests.get(requestKey) === request) {
      inFlightGetRequests.delete(requestKey);
    }
  });

  inFlightGetRequests.set(requestKey, request);
  return request;
};

export const getAvailableLeagues = async (options?: FetchOptions) => {
  return fetchJson<ApiLeague[]>(
    "/getavailableleagues",
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.availableLeagues),
  );
};

export const getAvailableLeaguesBySeason = async (
  season: number,
  options?: FetchOptions,
) => {
  return fetchJson<ApiLeague[]>(
    `/getavailableleagues/${season}`,
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.availableLeagues),
  );
};

export const getGroups = async (
  leagueShortcut: string,
  season: number,
  options?: FetchOptions,
) => {
  return fetchJson<ApiGroup[]>(
    `/getavailablegroups/${leagueShortcut}/${season}`,
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.groups),
  );
};

export const getCurrentGroup = async (
  leagueShortcut: string,
  options?: FetchOptions,
) => {
  return fetchJson<ApiGroup>(
    `/getcurrentgroup/${leagueShortcut}`,
    withOpenLigaDbCache(
      options,
      getShorterRevalidate(options, OPENLIGADB_CACHE_SECONDS.currentGroup),
    ),
  );
};

export const getMatchdayResults = async (
  leagueShortcut: string,
  season: number,
  groupOrderId: number,
  options?: FetchOptions,
) => {
  return fetchJson<ApiMatch[]>(
    `/getmatchdata/${leagueShortcut}/${season}/${groupOrderId}`,
    withOpenLigaDbCache(
      options,
      getShorterRevalidate(options, OPENLIGADB_CACHE_SECONDS.liveMatchday),
    ),
  );
};

export const getAllMatches = async (
  leagueShortcut: string,
  season: number,
  options?: FetchOptions,
) => {
  return fetchJson<ApiMatch[]>(
    `/getmatchdata/${leagueShortcut}/${season}`,
    withOpenLigaDbCache(
      options,
      getShorterRevalidate(options, OPENLIGADB_CACHE_SECONDS.seasonMatches),
    ),
  );
};

export const getMatchById = async (matchId: number, options?: FetchOptions) => {
  return fetchJson<ApiMatch>(
    `/getmatchdata/${matchId}`,
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.liveMatchday),
  );
};

export const getMatchesByTeamId = async (
  teamId: number,
  weeksPast: number,
  weeksFuture: number,
  options?: FetchOptions,
) => {
  return fetchJson<ApiMatch[]>(
    `/getmatchesbyteamid/${teamId}/${weeksPast}/${weeksFuture}`,
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.liveMatchday),
  );
};

export const getMatchesByGroup = async (
  leagueShortcut: string,
  season: number,
  groupOrderId: number,
  options?: FetchOptions,
) => {
  try {
    return await fetchJson<ApiMatch[]>(
      `/getmatchbygroup/${leagueShortcut}/${groupOrderId}/${season}`,
      withOpenLigaDbCache(
        options,
        getShorterRevalidate(options, OPENLIGADB_CACHE_SECONDS.liveMatchday),
      ),
    );
  } catch (error) {
    if (getStatusCode(error) !== 404) throw error;

    return fetchJson<ApiMatch[]>(
      `/getmatchdata/${leagueShortcut}/${season}/${groupOrderId}`,
      withOpenLigaDbCache(
        options,
        getShorterRevalidate(options, OPENLIGADB_CACHE_SECONDS.liveMatchday),
      ),
    );
  }
};

export const getTable = async (
  leagueShortcut: string,
  season: number,
  options?: FetchOptions,
) => {
  return fetchJson<ApiTableRow[]>(
    `/getbltable/${leagueShortcut}/${season}`,
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.table),
  );
};

export const getAvailableTeams = async (
  leagueShortcut: string,
  season: number,
  options?: FetchOptions,
) => {
  return fetchJson<ApiTeam[]>(
    `/getavailableteams/${leagueShortcut}/${season}`,
    withOpenLigaDbCache(options, OPENLIGADB_CACHE_SECONDS.teams),
  );
};
