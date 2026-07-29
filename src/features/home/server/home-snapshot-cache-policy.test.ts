import assert from "node:assert/strict";
import test from "node:test";
import type { HomeSnapshot } from "@footballleagues/core/home";
import {
  createKeyedSingleFlight,
  createSharedStaleBackoff,
  createSingleFlight,
  createStaleOnError,
  IncompleteSnapshotError,
  mapWithConcurrency,
  requireCacheableHomeSnapshot,
  SnapshotTimeoutError,
  withAbortableSnapshotDeadline,
  withSnapshotDeadline,
} from "./home-snapshot-cache-policy";

const homeSnapshot = (errorKeys: HomeSnapshot["errorKeys"] = []) =>
  ({
    availableGroups: [],
    bracketMatches: [],
    currentRound: { matches: [] },
    errorKeys,
    hasTable: false,
    leagueOptions: [],
    nextRound: { matches: [] },
    resolvedLeague: "bl1",
    resolvedSeason: 2025,
    table: [],
  }) satisfies HomeSnapshot;

test("cache policy accepts legitimate empty snapshots without errors", () => {
  const home = homeSnapshot();

  assert.equal(requireCacheableHomeSnapshot(home), home);
});

test("cache policy rejects fixture-critical home errors", () => {
  for (const errorKey of [
    "current group",
    "matchday",
    "groups",
    "playoffs",
    "next groups",
    "next matchday",
    "knockout rounds",
  ] satisfies HomeSnapshot["errorKeys"]) {
    assert.throws(
      () => requireCacheableHomeSnapshot(homeSnapshot([errorKey])),
      (error) =>
        error instanceof IncompleteSnapshotError &&
        error.errorKeys.includes(errorKey),
    );
  }
});

test("cache policy keeps fixtures usable when only the table failed", () => {
  const snapshot = homeSnapshot(["table"]);
  assert.equal(requireCacheableHomeSnapshot(snapshot), snapshot);
});

test("cache policy rejects a rate-limited snapshot even with only a table error", () => {
  const snapshot: HomeSnapshot = {
    ...homeSnapshot(["table"]),
    rateLimited: true,
  };

  assert.throws(
    () => requireCacheableHomeSnapshot(snapshot),
    (error) => error instanceof IncompleteSnapshotError && error.status === 429,
  );
});

test("snapshot deadline rejects instead of resolving a cacheable fallback", async () => {
  await assert.rejects(
    withSnapshotDeadline(new Promise(() => undefined), 5),
    (error) => error instanceof SnapshotTimeoutError && error.timeoutMs === 5,
  );
});

test("abortable snapshot deadline cancels the underlying work", async () => {
  let observedAbort = false;

  await assert.rejects(
    withAbortableSnapshotDeadline(
      (signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => {
            observedAbort = true;
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
      5,
    ),
    (error) => error instanceof SnapshotTimeoutError && error.timeoutMs === 5,
  );

  assert.equal(observedAbort, true);
});

test("shared backoff serves last-good data and suppresses repeated work", async () => {
  const values = new Map<string, unknown>();
  const cache = {
    get: async (key: string) => values.get(key) ?? null,
    set: async (key: string, value: unknown) => {
      values.set(key, value);
    },
  };
  let currentTime = 1_000;
  let calls = 0;
  let shouldFail = false;
  const load = createSharedStaleBackoff(
    async () => {
      calls += 1;
      if (shouldFail) throw new Error("failed");
      return { fixtures: [101, 202] };
    },
    () => "overview",
    {
      getCache: () => cache,
      maxStaleMs: 60 * 60 * 1_000,
      now: () => currentTime,
      random: () => 0.5,
      scheduleMs: [60_000],
      ttlSeconds: 3_600,
    },
  );

  assert.deepEqual(await load(), { fixtures: [101, 202] });
  shouldFail = true;
  currentTime = 2_000;
  assert.deepEqual(await load(), { fixtures: [101, 202] });
  currentTime = 3_000;
  assert.deepEqual(await load(), { fixtures: [101, 202] });
  assert.equal(calls, 2);
});

test("shared backoff keeps cold failures visible but skips their retry window", async () => {
  const values = new Map<string, unknown>();
  const cache = {
    get: async (key: string) => values.get(key) ?? null,
    set: async (key: string, value: unknown) => {
      values.set(key, value);
    },
  };
  let calls = 0;
  let currentTime = 1_000;
  const load = createSharedStaleBackoff(
    async () => {
      calls += 1;
      throw new Error("cold failure");
    },
    () => "overview",
    {
      getCache: () => cache,
      maxStaleMs: 60 * 60 * 1_000,
      now: () => currentTime,
      random: () => 0.5,
      scheduleMs: [60_000],
      ttlSeconds: 3_600,
    },
  );

  await assert.rejects(load(), /cold failure/);
  currentTime = 2_000;
  await assert.rejects(load(), /temporarily paused/);
  assert.equal(calls, 1);
});

test("single-flight shares concurrent work and clears after it settles", async () => {
  let calls = 0;
  let release: ((value: number) => void) | undefined;
  const load = createSingleFlight(() => {
    calls += 1;
    return new Promise<number>((resolve) => {
      release = resolve;
    });
  });

  const first = load();
  const second = load();
  const third = load();

  assert.equal(first, second);
  assert.equal(second, third);
  assert.equal(calls, 1);

  release?.(42);
  assert.deepEqual(await Promise.all([first, second, third]), [42, 42, 42]);

  const next = load();
  assert.equal(calls, 2);
  release?.(7);
  assert.equal(await next, 7);
});

test("keyed single-flight shares only matching work", async () => {
  let calls = 0;
  const load = createKeyedSingleFlight(
    async (key: string) => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 1));
      return key.toUpperCase();
    },
    (key) => key,
  );

  const [first, duplicate, different] = await Promise.all([
    load("bl1"),
    load("bl1"),
    load("cl"),
  ]);

  assert.deepEqual([first, duplicate, different], ["BL1", "BL1", "CL"]);
  assert.equal(calls, 2);
});

test("stale-on-error returns the identical last success but never hides a cold failure", async () => {
  const cold = createStaleOnError(
    async () => {
      throw new Error("cold failure");
    },
    () => "overview",
  );
  await assert.rejects(cold, /cold failure/);

  const fixtureSnapshot = { fixtureIds: [101, 202, 303] };
  let shouldFail = false;
  let staleEvents = 0;
  const load = createStaleOnError(
    async () => {
      if (shouldFail) throw new Error("refresh failure");
      return fixtureSnapshot;
    },
    () => "overview",
    { onStale: () => (staleEvents += 1) },
  );

  assert.equal(await load(), fixtureSnapshot);
  shouldFail = true;
  const stale = await load();

  assert.equal(stale, fixtureSnapshot);
  assert.deepEqual(stale.fixtureIds, [101, 202, 303]);
  assert.equal(staleEvents, 1);
});

test("concurrency mapper preserves order and respects its worker limit", async () => {
  let active = 0;
  let maximumActive = 0;

  const results = await mapWithConcurrency([4, 3, 2, 1], 2, async (value) => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    await new Promise((resolve) => setTimeout(resolve, value));
    active -= 1;
    return value * 10;
  });

  assert.deepEqual(results, [40, 30, 20, 10]);
  assert.equal(maximumActive, 2);
});

test("concurrency mapper stops scheduling and drains active work after a failure", async () => {
  let active = 0;
  let calls = 0;
  let completed = 0;
  const failure = new Error("mapper failed");

  await assert.rejects(
    mapWithConcurrency([0, 1, 2, 3, 4], 3, async (value) => {
      calls += 1;
      active += 1;

      try {
        await new Promise((resolve) =>
          setTimeout(resolve, value === 0 ? 1 : 8),
        );
        if (value === 0) throw failure;
        completed += 1;
        return value;
      } finally {
        active -= 1;
      }
    }),
    (error) => error === failure,
  );

  assert.equal(calls, 3);
  assert.equal(completed, 2);
  assert.equal(active, 0);
});
