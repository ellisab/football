import type { HomeSnapshot } from "@footballleagues/core/home";

type AsyncCacheStore = {
  get(key: string): Promise<unknown | null>;
  set(
    key: string,
    value: unknown,
    options?: { name?: string; tags?: string[]; ttl?: number },
  ): Promise<void>;
};

type SharedBackoffState<T> = {
  checkedAt: number;
  failureCount: number;
  lastGood?: T;
  lastGoodAt?: number;
  retryAt: number;
  version: 1;
};

const FIXTURE_CRITICAL_HOME_ERRORS = new Set<HomeSnapshot["errorKeys"][number]>(
  [
    "current group",
    "matchday",
    "groups",
    "playoffs",
    "next groups",
    "next matchday",
    "knockout rounds",
  ],
);

export class IncompleteSnapshotError extends Error {
  readonly errorKeys: readonly string[];
  readonly snapshotKind: "home";
  readonly status?: number;

  constructor({
    errorKeys,
    snapshotKind,
    status,
  }: {
    errorKeys: readonly string[];
    snapshotKind: "home";
    status?: number;
  }) {
    super(`Incomplete ${snapshotKind} snapshot`);
    this.name = "IncompleteSnapshotError";
    this.errorKeys = errorKeys;
    this.snapshotKind = snapshotKind;
    this.status = status;
  }
}

export class SnapshotTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Snapshot request exceeded ${timeoutMs}ms`);
    this.name = "SnapshotTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

class SnapshotBackoffOpenError extends Error {
  readonly retryAt: number;

  constructor(retryAt: number) {
    super("Snapshot refresh is temporarily paused");
    this.name = "SnapshotBackoffOpenError";
    this.retryAt = retryAt;
  }
}

export const requireCacheableHomeSnapshot = (snapshot: HomeSnapshot) => {
  const criticalErrors = snapshot.errorKeys.filter((errorKey) =>
    FIXTURE_CRITICAL_HOME_ERRORS.has(errorKey),
  );

  if (criticalErrors.length > 0 || snapshot.rateLimited) {
    throw new IncompleteSnapshotError({
      errorKeys: [
        ...criticalErrors,
        ...(snapshot.rateLimited ? ["rate limited"] : []),
      ],
      snapshotKind: "home",
      status: snapshot.rateLimited ? 429 : undefined,
    });
  }

  return snapshot;
};

export const withSnapshotDeadline = <T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new SnapshotTimeoutError(timeoutMs)),
      timeoutMs,
    );
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
};

export const withAbortableSnapshotDeadline = async <T>(
  load: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await load(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) throw new SnapshotTimeoutError(timeoutMs);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const isSharedBackoffState = <T>(
  value: unknown,
): value is SharedBackoffState<T> => {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Partial<SharedBackoffState<T>>;
  return (
    state.version === 1 &&
    typeof state.checkedAt === "number" &&
    typeof state.failureCount === "number" &&
    typeof state.retryAt === "number" &&
    (state.lastGoodAt === undefined || typeof state.lastGoodAt === "number")
  );
};

const readSharedBackoffState = async <T>(
  cache: AsyncCacheStore,
  key: string,
) => {
  try {
    const value = await cache.get(key);
    return isSharedBackoffState<T>(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

const writeSharedBackoffState = async <T>({
  cache,
  key,
  state,
  ttlSeconds,
}: {
  cache: AsyncCacheStore;
  key: string;
  state: SharedBackoffState<T>;
  ttlSeconds: number;
}) => {
  try {
    await cache.set(key, state, {
      name: key,
      tags: ["openligadb", "openligadb-overview"],
      ttl: ttlSeconds,
    });
  } catch {
    // Runtime Cache is an optimization. Upstream data must remain available
    // when the cache service itself is unavailable.
  }
};

const getErrorStatus = (error: unknown) =>
  (error as { status?: number } | undefined)?.status;

const getErrorRetryAfterMs = (error: unknown) => {
  const value = (error as { retryAfterMs?: number } | undefined)?.retryAfterMs;
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
};

export const createSharedStaleBackoff = <Args extends readonly unknown[], T>(
  load: (...args: Args) => Promise<T>,
  getKey: (...args: Args) => string,
  {
    getCache,
    maxStaleMs,
    now = Date.now,
    onStale,
    random = Math.random,
    rateLimitScheduleMs = [300_000, 600_000, 900_000],
    scheduleMs = [60_000, 120_000, 300_000, 900_000],
    ttlSeconds,
  }: {
    getCache: () => AsyncCacheStore;
    maxStaleMs: number;
    now?: () => number;
    onStale?: (context: { error: unknown; key: string }) => void;
    random?: () => number;
    rateLimitScheduleMs?: readonly number[];
    scheduleMs?: readonly number[];
    ttlSeconds: number;
  },
) => {
  if (scheduleMs.length < 1 || rateLimitScheduleMs.length < 1) {
    throw new RangeError("Backoff schedules must not be empty");
  }

  return async (...args: Args): Promise<T> => {
    const cache = getCache();
    const key = getKey(...args);
    const startedAt = now();
    const state = await readSharedBackoffState<T>(cache, key);
    const usableLastGood =
      state?.lastGood !== undefined &&
      state.lastGoodAt !== undefined &&
      startedAt - state.lastGoodAt <= maxStaleMs
        ? state.lastGood
        : undefined;

    if (state && state.retryAt > startedAt) {
      const error = new SnapshotBackoffOpenError(state.retryAt);
      if (usableLastGood !== undefined) {
        onStale?.({ error, key });
        return usableLastGood;
      }
      throw error;
    }

    try {
      const value = await load(...args);
      const checkedAt = now();
      await writeSharedBackoffState({
        cache,
        key,
        state: {
          checkedAt,
          failureCount: 0,
          lastGood: value,
          lastGoodAt: checkedAt,
          retryAt: 0,
          version: 1,
        },
        ttlSeconds,
      });
      return value;
    } catch (error) {
      const failedAt = now();
      const failureCount = (state?.failureCount ?? 0) + 1;
      const schedule =
        getErrorStatus(error) === 429 ? rateLimitScheduleMs : scheduleMs;
      const baseDelay =
        schedule[Math.min(failureCount - 1, schedule.length - 1)]!;
      const retryDelay = Math.max(
        Math.round(baseDelay * (0.9 + random() * 0.2)),
        getErrorRetryAfterMs(error) ?? 0,
      );
      await writeSharedBackoffState({
        cache,
        key,
        state: {
          checkedAt: state?.checkedAt ?? failedAt,
          failureCount,
          lastGood: usableLastGood,
          lastGoodAt:
            usableLastGood === undefined ? undefined : state?.lastGoodAt,
          retryAt: failedAt + retryDelay,
          version: 1,
        },
        ttlSeconds,
      });

      if (usableLastGood !== undefined) {
        onStale?.({ error, key });
        return usableLastGood;
      }
      throw error;
    }
  };
};

export const createKeyedSingleFlight = <Args extends readonly unknown[], T>(
  load: (...args: Args) => Promise<T>,
  getKey: (...args: Args) => string,
) => {
  const inFlight = new Map<string, Promise<T>>();

  return (...args: Args) => {
    const key = getKey(...args);
    const existing = inFlight.get(key);
    if (existing) return existing;

    const pending = load(...args);
    inFlight.set(key, pending);
    const clearPending = () => {
      if (inFlight.get(key) === pending) inFlight.delete(key);
    };
    void pending.then(clearPending, clearPending);

    return pending;
  };
};

export const createSingleFlight = <T>(load: () => Promise<T>) =>
  createKeyedSingleFlight(load, () => "singleton");

export const createStaleOnError = <Args extends readonly unknown[], T>(
  load: (...args: Args) => Promise<T>,
  getKey: (...args: Args) => string,
  {
    maxEntries = 32,
    onStale,
  }: {
    maxEntries?: number;
    onStale?: (context: { args: Args; error: unknown; key: string }) => void;
  } = {},
) => {
  if (!Number.isInteger(maxEntries) || maxEntries < 1) {
    throw new RangeError("maxEntries must be a positive integer");
  }

  const lastSuccessful = new Map<string, T>();

  return async (...args: Args) => {
    const key = getKey(...args);

    try {
      const value = await load(...args);
      lastSuccessful.delete(key);
      lastSuccessful.set(key, value);

      if (lastSuccessful.size > maxEntries) {
        const oldestKey = lastSuccessful.keys().next().value;
        if (oldestKey !== undefined) lastSuccessful.delete(oldestKey);
      }

      return value;
    } catch (error) {
      if (!lastSuccessful.has(key)) throw error;

      onStale?.({ args, error, key });
      return lastSuccessful.get(key) as T;
    }
  };
};

export const mapWithConcurrency = async <Input, Output>(
  inputs: readonly Input[],
  concurrency: number,
  mapper: (input: Input, index: number) => Promise<Output>,
): Promise<Output[]> => {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError("Concurrency must be a positive integer");
  }

  const results = new Array<Output>(inputs.length);
  let nextIndex = 0;
  let failure: unknown;
  let hasFailure = false;

  const worker = async () => {
    while (!hasFailure && nextIndex < inputs.length) {
      const index = nextIndex;
      nextIndex += 1;

      try {
        results[index] = await mapper(inputs[index] as Input, index);
      } catch (error) {
        if (!hasFailure) {
          failure = error;
          hasFailure = true;
        }
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, inputs.length) }, worker),
  );

  if (hasFailure) throw failure;

  return results;
};
