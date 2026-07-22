import assert from "node:assert/strict";
import test from "node:test";
import type { MatchdaySnapshot } from "@footballleagues/core/home";
import {
  loadMatchdayWithBackoff,
  MatchdayRefreshBackoffError,
} from "./matchday-refresh-cache";

class MemoryCache {
  readonly values = new Map<string, unknown>();

  async get(key: string) {
    return this.values.get(key) ?? null;
  }

  async set(key: string, value: unknown) {
    this.values.set(key, value);
  }
}

const params = {
  group: 10,
  league: "bl1",
  season: "2025",
};

const snapshot = ({
  matchId = 100,
  refreshFailed,
}: {
  matchId?: number;
  refreshFailed?: true;
} = {}): MatchdaySnapshot => ({
  cacheStatus: refreshFailed ? "stale" : "miss",
  dataUpdatedAt: 1_000,
  effectiveShortcut: "bl1",
  group: { groupName: "10. Spieltag", groupOrderID: 10 },
  lastChanged: "2026-07-22T18:00:00Z",
  matches: [{ matchID: matchId, matchIsFinished: false }],
  refreshFailed,
  resolvedLeague: "bl1",
  resolvedSeason: 2025,
});

test("matchday backoff keeps the last success and skips upstream while open", async () => {
  const cache = new MemoryCache();
  let currentTime = 1_000;
  let calls = 0;
  let fail = false;
  const loadSnapshot = async () => {
    calls += 1;
    if (fail) {
      const error = new Error("upstream failed") as Error & { status?: number };
      error.status = 503;
      throw error;
    }
    return snapshot();
  };

  const fresh = await loadMatchdayWithBackoff(params, {
    cache,
    loadSnapshot,
    now: () => currentTime,
    random: () => 0.5,
  });
  assert.equal(fresh.refreshState, "fresh");

  fail = true;
  currentTime = 2_000;
  const stale = await loadMatchdayWithBackoff(params, {
    cache,
    loadSnapshot,
    now: () => currentTime,
    random: () => 0.5,
  });

  assert.equal(stale.refreshState, "stale");
  assert.equal(stale.matches[0]?.matchID, 100);
  assert.equal(stale.retryAt, 17_000);

  currentTime = 3_000;
  const suppressed = await loadMatchdayWithBackoff(params, {
    cache,
    loadSnapshot,
    now: () => currentTime,
    random: () => 0.5,
  });

  assert.equal(suppressed.refreshState, "stale");
  assert.equal(suppressed.retryAt, 17_000);
  assert.equal(calls, 2);
});

test("matchday backoff is isolated per matchday for transient failures", async () => {
  const cache = new MemoryCache();
  let firstCalls = 0;
  const failure = new Error("failed") as Error & { status?: number };
  failure.status = 503;

  await assert.rejects(
    loadMatchdayWithBackoff(params, {
      cache,
      loadSnapshot: async () => {
        firstCalls += 1;
        throw failure;
      },
      now: () => 1_000,
      random: () => 0.5,
    }),
    MatchdayRefreshBackoffError
  );

  let otherCalls = 0;
  const other = await loadMatchdayWithBackoff(
    { ...params, group: 11 },
    {
      cache,
      loadSnapshot: async () => {
        otherCalls += 1;
        return {
          ...snapshot({ matchId: 101 }),
          group: { groupName: "11. Spieltag", groupOrderID: 11 },
        };
      },
      now: () => 2_000,
      random: () => 0.5,
    }
  );

  assert.equal(other.refreshState, "fresh");
  assert.equal(firstCalls, 1);
  assert.equal(otherCalls, 1);
});

test("a 429 honors Retry-After and opens the shared origin cooldown", async () => {
  const cache = new MemoryCache();
  const rateLimit = new Error("slow down") as Error & {
    retryAfterMs?: number;
    status?: number;
  };
  rateLimit.status = 429;
  rateLimit.retryAfterMs = 90_000;

  await assert.rejects(
    loadMatchdayWithBackoff(params, {
      cache,
      loadSnapshot: async () => {
        throw rateLimit;
      },
      now: () => 1_000,
      random: () => 0.5,
    }),
    (error) =>
      error instanceof MatchdayRefreshBackoffError &&
      error.status === 429 &&
      error.retryAt === 91_000
  );

  let calls = 0;
  await assert.rejects(
    loadMatchdayWithBackoff(
      { ...params, group: 12 },
      {
        cache,
        loadSnapshot: async () => {
          calls += 1;
          return snapshot();
        },
        now: () => 2_000,
        random: () => 0.5,
      }
    ),
    (error) =>
      error instanceof MatchdayRefreshBackoffError && error.status === 429
  );
  assert.equal(calls, 0);
});

test("runtime cache failures never block a healthy score refresh", async () => {
  const cache = {
    get: async () => {
      throw new Error("cache read failed");
    },
    set: async () => {
      throw new Error("cache write failed");
    },
  };

  const result = await loadMatchdayWithBackoff(params, {
    cache,
    loadSnapshot: async () => snapshot(),
    now: () => 1_000,
  });

  assert.equal(result.refreshState, "fresh");
  assert.equal(result.matches[0]?.matchID, 100);
});
