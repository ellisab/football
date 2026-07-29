import assert from "node:assert/strict";
import test from "node:test";
import type { FootballDataSource } from "../src/home";
import {
  clearMatchdayCache,
  loadMatchdayResults,
  MATCHDAY_CACHE_MAX_ENTRIES,
} from "../src/home/domain/matchday-loader";
import type { ApiMatch } from "../src/openligadb";

const createMatch = (matchID: number): ApiMatch => ({
  matchID,
  matchDateTimeUTC: "2026-08-28T18:30:00Z",
  matchIsFinished: false,
  matchResults: [],
  team1: { teamId: 1, teamName: "Team A" },
  team2: { teamId: 2, teamName: "Team B" },
});

const createDataSource = ({
  getLastChangeDate,
  getMatchdayResults,
}: Pick<
  FootballDataSource,
  "getLastChangeDate" | "getMatchdayResults"
>): FootballDataSource => ({
  getAvailableLeagues: async () => [],
  getCurrentGroup: async () => ({}),
  getGroups: async () => [],
  getLastChangeDate,
  getMatchdayResults,
  getMatchesByGroup: async () => [],
  getTable: async () => [],
});

test("loadMatchdayResults reuses cached matches when lastChanged is unchanged", async () => {
  clearMatchdayCache();

  let matchdayCalls = 0;
  const dataSource = createDataSource({
    getLastChangeDate: async () => "2026-07-04T18:00:00",
    getMatchdayResults: async () => {
      matchdayCalls += 1;
      return [createMatch(1)];
    },
  });

  const first = await loadMatchdayResults({
    dataSource,
    groupOrderId: 1,
    lastChangeStrategy: "always",
    leagueShortcut: "bl1",
    season: 2026,
  });
  const second = await loadMatchdayResults({
    dataSource,
    groupOrderId: 1,
    lastChangeStrategy: "always",
    leagueShortcut: "bl1",
    season: 2026,
  });

  assert.equal(first.cacheStatus, "miss");
  assert.equal(second.cacheStatus, "hit");
  assert.equal(matchdayCalls, 1);
  assert.equal(second.matches[0]?.matchID, 1);
});

test("loadMatchdayResults refetches matches when lastChanged changes", async () => {
  clearMatchdayCache();

  let matchdayCalls = 0;
  let lastChanged = "2026-07-04T18:00:00";
  const dataSource = createDataSource({
    getLastChangeDate: async () => lastChanged,
    getMatchdayResults: async () => {
      matchdayCalls += 1;
      return [createMatch(matchdayCalls)];
    },
  });

  await loadMatchdayResults({
    dataSource,
    groupOrderId: 2,
    lastChangeStrategy: "always",
    leagueShortcut: "bl1",
    season: 2026,
  });

  lastChanged = "2026-07-04T18:05:00";

  const updated = await loadMatchdayResults({
    dataSource,
    groupOrderId: 2,
    lastChangeStrategy: "always",
    leagueShortcut: "bl1",
    season: 2026,
  });

  assert.equal(updated.cacheStatus, "stale");
  assert.equal(matchdayCalls, 2);
  assert.equal(updated.matches[0]?.matchID, 2);
});

test("loadMatchdayResults skips last-change preflight on a cold default load", async () => {
  clearMatchdayCache();

  let lastChangeCalls = 0;
  let matchdayCalls = 0;
  const dataSource = createDataSource({
    getLastChangeDate: async () => {
      lastChangeCalls += 1;
      return "2026-07-04T18:00:00";
    },
    getMatchdayResults: async () => {
      matchdayCalls += 1;
      return [createMatch(3)];
    },
  });

  const result = await loadMatchdayResults({
    dataSource,
    groupOrderId: 3,
    leagueShortcut: "fbl1",
    season: 2025,
  });

  assert.equal(result.cacheStatus, "miss");
  assert.equal(result.lastChanged, undefined);
  assert.equal(result.matches[0]?.matchID, 3);
  assert.equal(lastChangeCalls, 0);
  assert.equal(matchdayCalls, 1);
});

test("loadMatchdayResults reuses a freshly loaded default entry without a preflight", async () => {
  clearMatchdayCache();

  let lastChangeCalls = 0;
  let matchdayCalls = 0;
  const dataSource = createDataSource({
    getLastChangeDate: async () => {
      lastChangeCalls += 1;
      return "2026-07-04T18:00:00";
    },
    getMatchdayResults: async () => {
      matchdayCalls += 1;
      return [createMatch(30)];
    },
  });

  await loadMatchdayResults({
    dataSource,
    groupOrderId: 30,
    leagueShortcut: "bl1",
    season: 2026,
  });
  const hit = await loadMatchdayResults({
    dataSource,
    groupOrderId: 30,
    leagueShortcut: "bl1",
    season: 2026,
  });

  assert.equal(hit.cacheStatus, "hit");
  assert.equal(lastChangeCalls, 0);
  assert.equal(matchdayCalls, 1);
});

test("loadMatchdayResults caches a cold success without a lastChanged value", async () => {
  clearMatchdayCache();

  let lastChangeCalls = 0;
  let matchdayCalls = 0;
  let refreshShouldFail = false;
  const dataSource = createDataSource({
    getLastChangeDate: async () => {
      lastChangeCalls += 1;
      throw new Error("last-change unavailable");
    },
    getMatchdayResults: async () => {
      matchdayCalls += 1;

      if (refreshShouldFail) {
        throw new Error("matchday unavailable");
      }

      return [createMatch(4)];
    },
  });

  const first = await loadMatchdayResults({
    dataSource,
    groupOrderId: 4,
    leagueShortcut: "bl1",
    season: 2026,
  });

  refreshShouldFail = true;

  const stale = await loadMatchdayResults({
    dataSource,
    groupOrderId: 4,
    lastChangeStrategy: "always",
    leagueShortcut: "bl1",
    season: 2026,
  });

  assert.equal(first.cacheStatus, "miss");
  assert.equal(first.lastChanged, undefined);
  assert.equal(stale.cacheStatus, "stale");
  assert.equal(stale.lastChanged, undefined);
  assert.equal(stale.matches[0]?.matchID, 4);
  assert.equal(lastChangeCalls, 1);
  assert.equal(matchdayCalls, 2);
});

test("loadMatchdayResults refreshes through a failed last-change check", async () => {
  clearMatchdayCache();

  let lastChangeCalls = 0;
  let matchdayCalls = 0;
  const dataSource = createDataSource({
    getLastChangeDate: async () => {
      lastChangeCalls += 1;
      throw new Error("last-change unavailable");
    },
    getMatchdayResults: async () => {
      matchdayCalls += 1;
      return [createMatch(matchdayCalls)];
    },
  });

  await loadMatchdayResults({
    dataSource,
    groupOrderId: 5,
    leagueShortcut: "bl1",
    season: 2026,
  });

  const refreshed = await loadMatchdayResults({
    dataSource,
    groupOrderId: 5,
    lastChangeStrategy: "always",
    leagueShortcut: "bl1",
    season: 2026,
  });

  assert.equal(refreshed.cacheStatus, "unchecked");
  assert.equal(refreshed.lastChanged, undefined);
  assert.equal(refreshed.matches[0]?.matchID, 2);
  assert.equal(lastChangeCalls, 1);
  assert.equal(matchdayCalls, 2);
});

test("loadMatchdayResults serves stale and signals rate limiting without a second request", async () => {
  clearMatchdayCache();

  let lastChangeCalls = 0;
  let matchdayCalls = 0;
  const dataSource = createDataSource({
    getLastChangeDate: async () => {
      lastChangeCalls += 1;
      throw Object.assign(new Error("rate limited"), { status: 429 });
    },
    getMatchdayResults: async () => {
      matchdayCalls += 1;
      return [createMatch(8)];
    },
  });

  await loadMatchdayResults({
    dataSource,
    groupOrderId: 8,
    leagueShortcut: "bl1",
    season: 2026,
  });
  const stale = await loadMatchdayResults({
    dataSource,
    groupOrderId: 8,
    lastChangeStrategy: "always",
    leagueShortcut: "bl1",
    season: 2026,
  });

  assert.equal(stale.cacheStatus, "stale");
  assert.equal(stale.matches[0]?.matchID, 8);
  assert.equal(stale.rateLimited, true);
  assert.equal(stale.refreshFailed, true);
  assert.equal(lastChangeCalls, 1);
  assert.equal(matchdayCalls, 1);
});

test("loadMatchdayResults marks a rate-limited refresh that falls back to stale matches", async () => {
  clearMatchdayCache();

  let lastChanged = "2026-07-04T18:00:00";
  let matchdayCalls = 0;
  const dataSource = createDataSource({
    getLastChangeDate: async () => lastChanged,
    getMatchdayResults: async () => {
      matchdayCalls += 1;
      if (matchdayCalls > 1) {
        throw Object.assign(new Error("rate limited"), { status: 429 });
      }
      return [createMatch(9)];
    },
  });

  await loadMatchdayResults({
    dataSource,
    groupOrderId: 9,
    lastChangeStrategy: "always",
    leagueShortcut: "bl1",
    season: 2026,
  });
  lastChanged = "2026-07-04T18:05:00";
  const stale = await loadMatchdayResults({
    dataSource,
    groupOrderId: 9,
    lastChangeStrategy: "always",
    leagueShortcut: "bl1",
    season: 2026,
  });

  assert.equal(stale.cacheStatus, "stale");
  assert.equal(stale.matches[0]?.matchID, 9);
  assert.equal(stale.rateLimited, true);
  assert.equal(stale.refreshFailed, true);
  assert.equal(matchdayCalls, 2);
});

test("loadMatchdayResults serves stale matches when a changed matchday cannot refresh", async () => {
  clearMatchdayCache();

  let lastChanged = "2026-07-04T18:00:00";
  let matchdayCalls = 0;
  let refreshShouldFail = false;
  const dataSource = createDataSource({
    getLastChangeDate: async () => lastChanged,
    getMatchdayResults: async () => {
      matchdayCalls += 1;

      if (refreshShouldFail) {
        throw Object.assign(new Error("matchday unavailable"), { status: 503 });
      }

      return [createMatch(6)];
    },
  });

  await loadMatchdayResults({
    dataSource,
    groupOrderId: 6,
    lastChangeStrategy: "always",
    leagueShortcut: "bl1",
    season: 2026,
  });

  lastChanged = "2026-07-04T18:05:00";
  refreshShouldFail = true;

  const stale = await loadMatchdayResults({
    dataSource,
    groupOrderId: 6,
    lastChangeStrategy: "always",
    leagueShortcut: "bl1",
    season: 2026,
  });

  assert.equal(stale.cacheStatus, "stale");
  assert.equal(stale.lastChanged, "2026-07-04T18:00:00");
  assert.equal(stale.matches[0]?.matchID, 6);
  assert.equal(stale.refreshFailed, true);
  assert.equal(matchdayCalls, 2);
});

test("loadMatchdayResults still throws when a cold matchday load fails", async () => {
  clearMatchdayCache();

  const failure = new Error("matchday unavailable");
  const dataSource = createDataSource({
    getLastChangeDate: async () => "2026-07-04T18:00:00",
    getMatchdayResults: async () => {
      throw failure;
    },
  });

  await assert.rejects(
    loadMatchdayResults({
      dataSource,
      groupOrderId: 7,
      leagueShortcut: "bl1",
      season: 2026,
    }),
    (error) => error === failure,
  );
});

test("matchday cache evicts the least-recently-used entry at its size cap", async () => {
  clearMatchdayCache();

  let shouldFail = false;
  const dataSource = createDataSource({
    getLastChangeDate: async () => "2026-07-04T18:00:00",
    getMatchdayResults: async (...args) => {
      const groupOrderId = args[2];
      if (shouldFail) throw new Error("matchday unavailable");
      return [createMatch(groupOrderId)];
    },
  });

  for (
    let groupOrderId = 1;
    groupOrderId <= MATCHDAY_CACHE_MAX_ENTRIES + 1;
    groupOrderId += 1
  ) {
    await loadMatchdayResults({
      dataSource,
      groupOrderId,
      leagueShortcut: "cache-cap",
      season: 2026,
    });
  }

  shouldFail = true;
  await assert.rejects(
    loadMatchdayResults({
      dataSource,
      groupOrderId: 1,
      leagueShortcut: "cache-cap",
      season: 2026,
    }),
    /matchday unavailable/,
  );
  const newest = await loadMatchdayResults({
    dataSource,
    groupOrderId: MATCHDAY_CACHE_MAX_ENTRIES + 1,
    lastChangeStrategy: "always",
    leagueShortcut: "cache-cap",
    season: 2026,
  });

  assert.equal(newest.cacheStatus, "stale");
  assert.equal(newest.matches[0]?.matchID, MATCHDAY_CACHE_MAX_ENTRIES + 1);
});
