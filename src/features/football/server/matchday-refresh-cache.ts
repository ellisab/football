import {
  getMatchdaySnapshot,
  type MatchdaySnapshot,
} from "@footballleagues/core/home";
import { isLeagueKey } from "@footballleagues/core/leagues";
import { OPENLIGADB_CACHE_SECONDS } from "@footballleagues/core/openligadb";
import type { RuntimeCache } from "@vercel/functions";
import { getFootballRuntimeCache } from "@/lib/server/runtime-cache";

const CACHE_RECORD_VERSION = 2;
const CACHE_TTL_SECONDS = OPENLIGADB_CACHE_SECONDS.seasonMatches;
const MAX_STALE_AGE_MS = CACHE_TTL_SECONDS * 1_000;
const TRANSIENT_BACKOFF_MS = [15_000, 30_000, 60_000, 120_000] as const;
const RATE_LIMIT_BACKOFF_MS = [60_000, 120_000, 300_000] as const;
const ORIGIN_COOLDOWN_KEY = "matchday:openligadb-origin";

type MatchdayParams = {
  group?: number | string;
  league?: string;
  season?: string;
};

type CacheStore = Pick<RuntimeCache, "get" | "set">;

type MatchdayRefreshState = {
  checkedAt: number;
  failureCount: number;
  lastFailureStatus?: number;
  lastGood?: MatchdaySnapshot;
  lastGoodAt?: number;
  retryAt: number;
  version: typeof CACHE_RECORD_VERSION;
};

type OriginCooldownState = {
  failureCount: number;
  retryAt: number;
  version: typeof CACHE_RECORD_VERSION;
};

export type MatchdayRefreshResult = MatchdaySnapshot & {
  checkedAt: number;
  refreshState: "fresh" | "stale";
  retryAt?: number;
};

export class MatchdayRefreshBackoffError extends Error {
  readonly retryAt: number;
  readonly status: number;

  constructor({
    cause,
    retryAt,
    status,
  }: {
    cause?: unknown;
    retryAt: number;
    status: number;
  }) {
    super("Matchday refresh is temporarily paused.", { cause });
    this.name = "MatchdayRefreshBackoffError";
    this.retryAt = retryAt;
    this.status = status;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isMatchdaySnapshot = (value: unknown): value is MatchdaySnapshot =>
  isRecord(value) &&
  typeof value.resolvedLeague === "string" &&
  typeof value.resolvedSeason === "number" &&
  Array.isArray(value.matches) &&
  isRecord(value.group);

const isMatchdayRefreshState = (
  value: unknown
): value is MatchdayRefreshState =>
  isRecord(value) &&
  value.version === CACHE_RECORD_VERSION &&
  typeof value.checkedAt === "number" &&
  typeof value.failureCount === "number" &&
  typeof value.retryAt === "number" &&
  (value.lastGood === undefined || isMatchdaySnapshot(value.lastGood)) &&
  (value.lastGoodAt === undefined || typeof value.lastGoodAt === "number");

const isOriginCooldownState = (
  value: unknown
): value is OriginCooldownState =>
  isRecord(value) &&
  value.version === CACHE_RECORD_VERSION &&
  typeof value.failureCount === "number" &&
  typeof value.retryAt === "number";

const getStatusCode = (error: unknown) => {
  const status = (error as { status?: number } | undefined)?.status;
  return typeof status === "number" ? status : undefined;
};

const getRetryAfterMs = (error: unknown) => {
  const retryAfterMs = (
    error as { retryAfterMs?: number } | undefined
  )?.retryAfterMs;
  return typeof retryAfterMs === "number" &&
    Number.isFinite(retryAfterMs) &&
    retryAfterMs >= 0
    ? retryAfterMs
    : undefined;
};

const getCacheKey = (params: MatchdayParams) => {
  const league = params.league;
  const group =
    typeof params.group === "number"
      ? params.group
      : Number.parseInt(params.group ?? "", 10);
  const season = Number.parseInt(params.season ?? "", 10);

  if (
    !league ||
    !isLeagueKey(league) ||
    !Number.isInteger(group) ||
    group < 1 ||
    !Number.isInteger(season) ||
    season < 1
  ) {
    return undefined;
  }

  return `matchday:${league}:${season}:${group}`;
};

const safeGet = async (cache: CacheStore, key: string) => {
  try {
    return await cache.get(key);
  } catch (error) {
    if (process.env.OPENLIGADB_DIAGNOSTICS === "1") {
      console.warn("[OpenLigaDB] runtime cache read failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
        key,
      });
    }
    return null;
  }
};

const safeSet = async (
  cache: CacheStore,
  key: string,
  value: MatchdayRefreshState | OriginCooldownState
) => {
  try {
    await cache.set(key, value, {
      name: key,
      tags: ["openligadb", "openligadb-matchdays"],
      ttl: CACHE_TTL_SECONDS,
    });
  } catch (error) {
    if (process.env.OPENLIGADB_DIAGNOSTICS === "1") {
      console.warn("[OpenLigaDB] runtime cache write failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
        key,
      });
    }
  }
};

const getBackoffMs = ({
  failureCount,
  random,
  retryAfterMs,
  status,
}: {
  failureCount: number;
  random: () => number;
  retryAfterMs?: number;
  status?: number;
}) => {
  const schedule =
    status === 429 ? RATE_LIMIT_BACKOFF_MS : TRANSIENT_BACKOFF_MS;
  const base = schedule[Math.min(failureCount - 1, schedule.length - 1)]!;
  const jittered = Math.round(base * (0.9 + random() * 0.2));
  return Math.max(jittered, retryAfterMs ?? 0);
};

const getUsableLastGood = (
  state: MatchdayRefreshState | undefined,
  now: number
) =>
  state?.lastGood &&
  state.lastGoodAt !== undefined &&
  now - state.lastGoodAt <= MAX_STALE_AGE_MS
    ? state.lastGood
    : undefined;

const toStaleResult = ({
  checkedAt,
  retryAt,
  snapshot,
}: {
  checkedAt: number;
  retryAt: number;
  snapshot: MatchdaySnapshot;
}): MatchdayRefreshResult => ({
  ...snapshot,
  checkedAt,
  refreshFailed: true,
  refreshState: "stale",
  retryAt,
});

const inFlightLoads = new Map<string, Promise<MatchdayRefreshResult>>();

const loadValidatedSnapshot = (
  params: MatchdayParams,
  loadSnapshot: typeof getMatchdaySnapshot
) => {
  const signal = AbortSignal.timeout(4_000);

  return loadSnapshot(params, {
    requestOptions: {
      next: { revalidate: OPENLIGADB_CACHE_SECONDS.liveMatchday },
      signal,
    },
    validationRequestOptions: {
      cache: "no-store",
      signal,
    },
  });
};

export const loadMatchdayWithBackoff = async (
  params: MatchdayParams,
  {
    cache = getFootballRuntimeCache(),
    loadSnapshot = getMatchdaySnapshot,
    now = Date.now,
    random = Math.random,
  }: {
    cache?: CacheStore;
    loadSnapshot?: typeof getMatchdaySnapshot;
    now?: () => number;
    random?: () => number;
  } = {}
): Promise<MatchdayRefreshResult> => {
  const cacheKey = getCacheKey(params);
  if (!cacheKey) {
    const snapshot = await loadValidatedSnapshot(params, loadSnapshot);
    const checkedAt = now();
    return { ...snapshot, checkedAt, refreshState: "fresh" };
  }

  const existing = inFlightLoads.get(cacheKey);
  if (existing) return existing;

  const pending = (async (): Promise<MatchdayRefreshResult> => {
    const currentTime = now();
    const [rawState, rawOriginCooldown] = await Promise.all([
      safeGet(cache, cacheKey),
      safeGet(cache, ORIGIN_COOLDOWN_KEY),
    ]);
    const state = isMatchdayRefreshState(rawState) ? rawState : undefined;
    const originCooldown = isOriginCooldownState(rawOriginCooldown)
      ? rawOriginCooldown
      : undefined;
    const lastGood = getUsableLastGood(state, currentTime);
    const activeRetryAt = Math.max(
      state?.retryAt ?? 0,
      originCooldown?.retryAt ?? 0
    );

    if (activeRetryAt > currentTime) {
      if (lastGood) {
        return toStaleResult({
          checkedAt: state?.checkedAt ?? currentTime,
          retryAt: activeRetryAt,
          snapshot: lastGood,
        });
      }

      throw new MatchdayRefreshBackoffError({
        retryAt: activeRetryAt,
        status:
          originCooldown?.retryAt && originCooldown.retryAt > currentTime
            ? 429
            : (state?.lastFailureStatus ?? 503),
      });
    }

    if (
      state?.lastGood &&
      state.failureCount === 0 &&
      state.retryAt === 0 &&
      state.checkedAt + OPENLIGADB_CACHE_SECONDS.liveMatchday * 1_000 >
        currentTime
    ) {
      return {
        ...state.lastGood,
        checkedAt: state.checkedAt,
        refreshState: "fresh",
      };
    }

    try {
      const snapshot = await loadValidatedSnapshot(params, loadSnapshot);
      const checkedAt = now();

      if (!snapshot.refreshFailed) {
        const freshSnapshot = {
          ...snapshot,
          rateLimited: undefined,
          retryAfterMs: undefined,
        };
        await safeSet(cache, cacheKey, {
          checkedAt,
          failureCount: 0,
          lastGood: freshSnapshot,
          lastGoodAt: snapshot.dataUpdatedAt ?? checkedAt,
          retryAt: 0,
          version: CACHE_RECORD_VERSION,
        });

        return {
          ...freshSnapshot,
          checkedAt,
          refreshState: "fresh",
        };
      }

      const status = snapshot.rateLimited ? 429 : 503;
      const failureCount =
        Math.max(
          state?.failureCount ?? 0,
          status === 429 ? (originCooldown?.failureCount ?? 0) : 0
        ) + 1;
      const retryAt =
        checkedAt +
        getBackoffMs({
          failureCount,
          random,
          retryAfterMs: snapshot.retryAfterMs,
          status,
        });
      const fallback = lastGood ?? snapshot;
      const fallbackAt =
        state?.lastGoodAt ?? snapshot.dataUpdatedAt ?? checkedAt;

      await safeSet(cache, cacheKey, {
        checkedAt,
        failureCount,
        lastFailureStatus: status,
        lastGood: fallback,
        lastGoodAt: fallbackAt,
        retryAt,
        version: CACHE_RECORD_VERSION,
      });

      if (status === 429) {
        await safeSet(cache, ORIGIN_COOLDOWN_KEY, {
          failureCount: (originCooldown?.failureCount ?? 0) + 1,
          retryAt,
          version: CACHE_RECORD_VERSION,
        });
      }

      return toStaleResult({
        checkedAt,
        retryAt,
        snapshot: fallback,
      });
    } catch (error) {
      if (error instanceof MatchdayRefreshBackoffError) throw error;

      const failedAt = now();
      const status = getStatusCode(error) ?? 503;
      const failureCount =
        Math.max(
          state?.failureCount ?? 0,
          status === 429 ? (originCooldown?.failureCount ?? 0) : 0
        ) + 1;
      const retryAt =
        failedAt +
        getBackoffMs({
          failureCount,
          random,
          retryAfterMs: getRetryAfterMs(error),
          status,
        });

      await safeSet(cache, cacheKey, {
        checkedAt: state?.checkedAt ?? failedAt,
        failureCount,
        lastFailureStatus: status,
        lastGood,
        lastGoodAt: state?.lastGoodAt,
        retryAt,
        version: CACHE_RECORD_VERSION,
      });

      if (status === 429) {
        await safeSet(cache, ORIGIN_COOLDOWN_KEY, {
          failureCount: (originCooldown?.failureCount ?? 0) + 1,
          retryAt,
          version: CACHE_RECORD_VERSION,
        });
      }

      if (lastGood) {
        return toStaleResult({
          checkedAt: state?.checkedAt ?? failedAt,
          retryAt,
          snapshot: lastGood,
        });
      }

      throw new MatchdayRefreshBackoffError({
        cause: error,
        retryAt,
        status,
      });
    }
  })();

  inFlightLoads.set(cacheKey, pending);

  try {
    return await pending;
  } finally {
    if (inFlightLoads.get(cacheKey) === pending) inFlightLoads.delete(cacheKey);
  }
};

export const getMatchdayRetrySeconds = (
  retryAt: number | undefined,
  now: number = Date.now()
) => Math.max(1, Math.ceil(((retryAt ?? now) - now) / 1_000));
