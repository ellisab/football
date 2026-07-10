import { OPENLIGADB_CACHE_SECONDS } from "../../openligadb/cache-policy";
import type { ApiMatch } from "../../openligadb";
import type { FootballDataSource, HomeRequestOptions } from "../data-source";
import { getStatusCode } from "./shared";

type MatchdayCacheEntry = {
  expiresAt: number;
  lastChanged: string;
  matches: ApiMatch[];
};

export type MatchdayCacheStatus =
  | "bypass"
  | "hit"
  | "miss"
  | "stale"
  | "unchecked";

type MatchdayLoadResult = {
  cacheStatus: MatchdayCacheStatus;
  lastChanged?: string;
  matches: ApiMatch[];
};

type LastChangeStrategy = "always" | "when-cached" | "never";

const MATCHDAY_CACHE_MAX_AGE_MS =
  OPENLIGADB_CACHE_SECONDS.seasonMatches * 1_000;

const matchdayCache = new Map<string, MatchdayCacheEntry>();

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
  }
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
  const cacheKey = getCacheKey({ groupOrderId, leagueShortcut, season });
  const cached = matchdayCache.get(cacheKey);
  const now = Date.now();
  let lastChanged: string | undefined;
  let lastChangeUnavailable = false;
  const shouldCheckLastChanged =
    lastChangeStrategy === "always" ||
    (lastChangeStrategy === "when-cached" && cached !== undefined);

  if (shouldCheckLastChanged) {
    try {
      lastChanged = await dataSource.getLastChangeDate(
        leagueShortcut,
        season,
        groupOrderId,
        requestOptions
      );
    } catch (error) {
      lastChangeUnavailable = true;

      if (getStatusCode(error) !== 404 && shouldLogDiagnostics()) {
        console.warn("[OpenLigaDB] last-change check failed", {
          groupOrderId,
          leagueShortcut,
          season,
          status: getStatusCode(error),
        });
      }
    }
  }

  if (lastChanged && cached?.lastChanged === lastChanged) {
    const cacheStatus = cached.expiresAt > now ? "hit" : "stale";
    if (cacheStatus === "hit") {
      logMatchdayCache(cacheStatus, { groupOrderId, leagueShortcut, season });
      return {
        cacheStatus,
        lastChanged,
        matches: cached.matches,
      };
    }
  }

  const matches = await dataSource.getMatchdayResults(
    leagueShortcut,
    season,
    groupOrderId,
    requestOptions
  );

  const cacheStatus = !shouldCheckLastChanged
    ? cached
      ? "bypass"
      : "miss"
    : lastChangeUnavailable
    ? "unchecked"
    : cached
      ? "stale"
      : "miss";

  if (lastChanged) {
    matchdayCache.set(cacheKey, {
      expiresAt: now + MATCHDAY_CACHE_MAX_AGE_MS,
      lastChanged,
      matches,
    });
  }

  logMatchdayCache(cacheStatus, { groupOrderId, leagueShortcut, season });

  return {
    cacheStatus,
    lastChanged,
    matches,
  };
};
