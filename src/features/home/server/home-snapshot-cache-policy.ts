import type { HomeSnapshot } from "@footballleagues/core/home";
import type { WorldCupSnapshot } from "@footballleagues/core/world-cup";

const FIXTURE_CRITICAL_HOME_ERRORS = new Set<HomeSnapshot["errorKeys"][number]>([
  "current group",
  "matchday",
  "groups",
  "playoffs",
  "next groups",
  "next matchday",
  "knockout rounds",
]);

const FIXTURE_CRITICAL_WORLD_CUP_ERRORS = new Set<
  WorldCupSnapshot["errors"][number]
>(["discovery", "groups", "matches"]);

export class IncompleteSnapshotError extends Error {
  readonly errorKeys: readonly string[];
  readonly snapshotKind: "home" | "world-cup";
  readonly status?: number;

  constructor({
    errorKeys,
    snapshotKind,
    status,
  }: {
    errorKeys: readonly string[];
    snapshotKind: "home" | "world-cup";
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

export const requireCacheableHomeSnapshot = (snapshot: HomeSnapshot) => {
  const criticalErrors = snapshot.errorKeys.filter((errorKey) =>
    FIXTURE_CRITICAL_HOME_ERRORS.has(errorKey)
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

export const requireCacheableWorldCupSnapshot = (
  snapshot: WorldCupSnapshot
) => {
  const criticalErrors = snapshot.errors.filter((errorKey) =>
    FIXTURE_CRITICAL_WORLD_CUP_ERRORS.has(errorKey)
  );

  if (snapshot.status === "error" || criticalErrors.length > 0) {
    throw new IncompleteSnapshotError({
      errorKeys:
        criticalErrors.length > 0 ? criticalErrors : [snapshot.status],
      snapshotKind: "world-cup",
    });
  }

  return snapshot;
};

export const withSnapshotDeadline = <T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new SnapshotTimeoutError(timeoutMs)),
      timeoutMs
    );
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
};

export const createKeyedSingleFlight = <Args extends readonly unknown[], T>(
  load: (...args: Args) => Promise<T>,
  getKey: (...args: Args) => string
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
    onStale?: (context: {
      args: Args;
      error: unknown;
      key: string;
    }) => void;
  } = {}
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
  mapper: (input: Input, index: number) => Promise<Output>
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
    Array.from({ length: Math.min(concurrency, inputs.length) }, worker)
  );

  if (hasFailure) throw failure;

  return results;
};
