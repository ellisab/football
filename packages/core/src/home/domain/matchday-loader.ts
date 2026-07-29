import type { ApiMatch } from "../../openligadb";
import { OPENLIGADB_CACHE_SECONDS } from "../../openligadb/cache-policy";
import type { FootballDataSource, HomeRequestOptions } from "../data-source";
import { getRetryAfterMs, getStatusCode } from "./shared";

type MatchdayCacheEntry = {
  dataUpdatedAt: number;
  expiresAt: number;
  lastChanged?: string;
  matches: ApiMatch[];
  revalidateAt: number;
};

export type MatchdayCacheStatus =
  | "bypass"
  | "hit"
  | "miss"
  | "stale"
  | "unchecked";

type MatchdayLoadResult = {
  cacheStatus: MatchdayCacheStatus;
  dataUpdatedAt?: number;
  lastChanged?: string;
  matches: ApiMatch[];
  rateLimited?: boolean;
  retryAfterMs?: number;
  refreshFailed?: true;
};

type LastChangeStrategy = "always" | "when-cached" | "never";

const MATCHDAY_CACHE_MAX_AGE_MS =
  OPENLIGADB_CACHE_SECONDS.seasonMatches * 1_000;
const MATCHDAY_CACHE_REVALIDATE_MS =
  OPENLIGADB_CACHE_SECONDS.liveMatchday * 1_000;
export const MATCHDAY_CACHE_MAX_ENTRIES = 128;

const matchdayCache = new Map<string, MatchdayCacheEntry>();

const getCachedMatchday = (cacheKey: string) => {
  const cached = matchdayCache.get(cacheKey);
  if (!cached) return undefined;

  matchdayCache.delete(cacheKey);
  matchdayCache.set(cacheKey, cached);
  return cached;
};

const setCachedMatchday = (cacheKey: string, entry: MatchdayCacheEntry) => {
  matchdayCache.delete(cacheKey);
  matchdayCache.set(cacheKey, entry);

  if (matchdayCache.size > MATCHDAY_CACHE_MAX_ENTRIES) {
    const oldestKey = matchdayCache.keys().next().value;
    if (oldestKey !== undefined) matchdayCache.delete(oldestKey);
  }
};

const getCacheKey = ({
  groupOrderId,
  leagueShortcut,
  season,
}: {
  groupOrderId: number;
  leagueShortcut: string;
  season: number;
}) => `${leagueShortcut}:${season}:${groupOrderId}`;

const shouldLogDiagnostics = () => {
  return process.env.OPENLIGADB_DIAGNOSTICS === "1";
};

const logMatchdayCache = (
  status: MatchdayCacheStatus,
  context: {
    groupOrderId: number;
    leagueShortcut: string;
    season: number;
  },
) => {
  if (!shouldLogDiagnostics()) return;

  console.info("[OpenLigaDB] matchday cache", {
    ...context,
    status,
  });
};

export const clearMatchdayCache = () => {
  matchdayCache.clear();
};

export const loadMatchdayResults = async ({
  dataSource,
  groupOrderId,
  lastChangeStrategy = "when-cached",
  leagueShortcut,
  requestOptions,
  season,
}: {
  dataSource: FootballDataSource;
  groupOrderId: number;
  lastChangeStrategy?: LastChangeStrategy;
  leagueShortcut: string;
  requestOptions?: HomeRequestOptions;
  season: number;
}): Promise<MatchdayLoadResult> => {
  const cacheContext = { groupOrderId, leagueShortcut, season };
  const cacheKey = getCacheKey({ groupOrderId, leagueShortcut, season });
  const cached = getCachedMatchday(cacheKey);
  const now = Date.now();
  let lastChanged: string | undefined;
  let lastChangeUnavailable = false;
  const shouldCheckLastChanged =
    lastChangeStrategy === "always" ||
    (lastChangeStrategy === "when-cached" && cached !== undefined);

  if (
    lastChangeStrategy === "when-cached" &&
    cached &&
    cached.revalidateAt > now
  ) {
    logMatchdayCache("hit", cacheContext);
    return {
      cacheStatus: "hit",
      dataUpdatedAt: cached.dataUpdatedAt,
      lastChanged: cached.lastChanged,
      matches: cached.matches,
    };
  }

  if (shouldCheckLastChanged) {
    try {
      lastChanged = await dataSource.getLastChangeDate(
        leagueShortcut,
        season,
        groupOrderId,
        requestOptions,
      );
    } catch (error) {
      lastChangeUnavailable = true;
      const status = getStatusCode(error);

      if (status !== 404 && shouldLogDiagnostics()) {
        console.warn("[OpenLigaDB] last-change check failed", {
          groupOrderId,
          leagueShortcut,
          season,
          status,
        });
      }

      if (status === 429) {
        if (!cached) throw error;

        logMatchdayCache("stale", cacheContext);
        return {
          cacheStatus: "stale",
          dataUpdatedAt: cached.dataUpdatedAt,
          lastChanged: cached.lastChanged,
          matches: cached.matches,
          rateLimited: true,
          retryAfterMs: getRetryAfterMs(error),
          refreshFailed: true,
        };
      }
    }
  }

  if (lastChanged && cached?.lastChanged === lastChanged) {
    const cacheStatus = cached.expiresAt > now ? "hit" : "stale";
    if (cacheStatus === "hit") {
      setCachedMatchday(cacheKey, {
        ...cached,
        revalidateAt: now + MATCHDAY_CACHE_REVALIDATE_MS,
      });
      logMatchdayCache(cacheStatus, cacheContext);
      return {
        cacheStatus,
        dataUpdatedAt: cached.dataUpdatedAt,
        lastChanged,
        matches: cached.matches,
      };
    }
  }

  let matches: ApiMatch[];

  try {
    matches = await dataSource.getMatchdayResults(
      leagueShortcut,
      season,
      groupOrderId,
      requestOptions,
    );
  } catch (error) {
    if (!cached) throw error;

    if (shouldLogDiagnostics()) {
      console.warn(
        "[OpenLigaDB] matchday refresh failed; serving stale cache",
        {
          ...cacheContext,
          status: getStatusCode(error),
        },
      );
    }

    logMatchdayCache("stale", cacheContext);

    return {
      cacheStatus: "stale",
      dataUpdatedAt: cached.dataUpdatedAt,
      lastChanged: cached.lastChanged,
      matches: cached.matches,
      rateLimited: getStatusCode(error) === 429 || undefined,
      retryAfterMs: getRetryAfterMs(error),
      refreshFailed: true,
    };
  }

  const cacheStatus = !shouldCheckLastChanged
    ? cached
      ? "bypass"
      : "miss"
    : lastChangeUnavailable
      ? "unchecked"
      : cached
        ? "stale"
        : "miss";

  setCachedMatchday(cacheKey, {
    dataUpdatedAt: now,
    expiresAt: now + MATCHDAY_CACHE_MAX_AGE_MS,
    lastChanged,
    matches,
    revalidateAt: now + MATCHDAY_CACHE_REVALIDATE_MS,
  });

  logMatchdayCache(cacheStatus, cacheContext);

  return {
    cacheStatus,
    dataUpdatedAt: now,
    lastChanged,
    matches,
  };
};
