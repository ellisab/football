import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import type { FootballDataSource } from "../src/home";
import { getHomeSnapshot } from "../src/home";
import { loadBracketMatches } from "../src/home/domain/load-bracket";
import { getGroupsWithFallback } from "../src/home/domain/league-groups";
import { clearMatchdayCache } from "../src/home/domain/matchday-loader";
import { resolveRoundSnapshots } from "../src/home/domain/resolve-rounds";
import type { ApiGroup, ApiMatch } from "../src/openligadb";

beforeEach(() => {
  clearMatchdayCache();
});

const createDataSource = (
  overrides: Partial<FootballDataSource> = {}
): FootballDataSource => ({
  getAvailableLeagues: async () => [],
  getCurrentGroup: async () => ({}),
  getGroups: async () => [],
  getLastChangeDate: async () => "2026-07-11T12:00:00Z",
  getMatchdayResults: async () => [],
  getMatchesByGroup: async () => [],
  getTable: async () => [],
  ...overrides,
});

const createGroups = (count: number, groupName = "Viertelfinale") => {
  return Array.from({ length: count }, (_, index): ApiGroup => ({
    groupID: index + 1,
    groupName,
    groupOrderID: index + 1,
  }));
};

const createFinishedMatch = (matchID: number): ApiMatch => ({
  matchID,
  matchDateTimeUTC: "2026-07-11T18:00:00Z",
  matchIsFinished: true,
  matchResults: [{ pointsTeam1: 1, pointsTeam2: 0, resultTypeID: 2 }],
  team1: { teamId: 1, teamName: "Team A" },
  team2: { teamId: 2, teamName: "Team B" },
});

const createStatusError = (status: number) => {
  return Object.assign(new Error(`OpenLigaDB ${status}`), { status });
};

const waitForTurn = () => {
  return new Promise((resolve) => setTimeout(resolve, 5));
};

test("loadBracketMatches limits knockout requests to three at a time", async () => {
  const groups = createGroups(9);
  let activeRequests = 0;
  let maxActiveRequests = 0;
  let requestCount = 0;
  const dataSource = createDataSource({
    getMatchdayResults: async () => {
      requestCount += 1;
      activeRequests += 1;
      maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
      await waitForTurn();
      activeRequests -= 1;
      return [];
    },
  });

  await loadBracketMatches({
    dataSource,
    resolvedLeague: "dfb",
    currentRound: { matches: [] },
    nextRound: { matches: [] },
    groups,
    playoffMatches: [],
    effectiveShortcut: "dfb",
    resolvedSeason: 2026,
  });

  assert.equal(requestCount, groups.length);
  assert.equal(maxActiveRequests, 3);
});

test("loadBracketMatches stops scheduling knockout requests after a 429", async () => {
  const groups = createGroups(9);
  let requestCount = 0;
  const dataSource = createDataSource({
    getMatchdayResults: async (_league, _season, groupOrderId) => {
      requestCount += 1;

      if (groupOrderId === 1) {
        throw createStatusError(429);
      }

      await waitForTurn();
      return [];
    },
  });

  const result = await loadBracketMatches({
    dataSource,
    resolvedLeague: "dfb",
    currentRound: { matches: [] },
    nextRound: { matches: [] },
    groups,
    playoffMatches: [],
    effectiveShortcut: "dfb",
    resolvedSeason: 2026,
  });

  assert.equal(requestCount, 3);
  assert.deepEqual(result.errorKeys, ["knockout rounds"]);
  assert.equal(result.rateLimited, true);
});

test("loadBracketMatches stops after a warm stale result signals rate limiting", async (t) => {
  const originalNow = Date.now;
  let now = 1_000;
  Date.now = () => now;
  t.after(() => {
    Date.now = originalNow;
  });
  const groups = createGroups(9);
  let rateLimited = false;
  let lastChangeCalls = 0;
  let matchdayCalls = 0;
  const dataSource = createDataSource({
    getLastChangeDate: async () => {
      lastChangeCalls += 1;
      if (rateLimited) throw createStatusError(429);
      return "2026-07-11T12:00:00Z";
    },
    getMatchdayResults: async (...args) => {
      const groupOrderId = args[2];
      matchdayCalls += 1;
      return [createFinishedMatch(groupOrderId)];
    },
  });
  const params = {
    dataSource,
    resolvedLeague: "dfb" as const,
    currentRound: { matches: [] },
    nextRound: { matches: [] },
    groups,
    playoffMatches: [],
    effectiveShortcut: "dfb",
    resolvedSeason: 2026,
  };

  await loadBracketMatches(params);
  now += 61_000;
  rateLimited = true;
  lastChangeCalls = 0;
  matchdayCalls = 0;
  const stale = await loadBracketMatches(params);

  assert.equal(lastChangeCalls, 3);
  assert.equal(matchdayCalls, 0);
  assert.deepEqual(stale.errorKeys, ["knockout rounds"]);
  assert.equal(stale.rateLimited, true);
});

for (const { status, expectedErrors } of [
  { status: 404, expectedErrors: [] },
  { status: 500, expectedErrors: ["knockout rounds"] },
] as const) {
  test(`loadBracketMatches continues after a ${status} response`, async () => {
    const groups = createGroups(6);
    let requestCount = 0;
    const dataSource = createDataSource({
      getMatchdayResults: async (_league, _season, groupOrderId) => {
        requestCount += 1;

        if (groupOrderId === 1) {
          throw createStatusError(status);
        }

        return [];
      },
    });

    const result = await loadBracketMatches({
      dataSource,
      resolvedLeague: "dfb",
      currentRound: { matches: [] },
      nextRound: { matches: [] },
      groups,
      playoffMatches: [],
      effectiveShortcut: "dfb",
      resolvedSeason: 2026,
    });

    assert.equal(requestCount, groups.length);
    assert.deepEqual(result.errorKeys, expectedErrors);
  });
}

test("resolveRoundSnapshots limits candidate group requests to three at a time", async () => {
  const groups = createGroups(10, "Spieltag");
  let activeRequests = 0;
  let maxActiveRequests = 0;
  let requestCount = 0;
  const dataSource = createDataSource({
    getMatchdayResults: async () => {
      requestCount += 1;
      activeRequests += 1;
      maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
      await waitForTurn();
      activeRequests -= 1;
      return [];
    },
  });

  const result = await resolveRoundSnapshots({
    dataSource,
    currentGroup: groups[0] as ApiGroup,
    currentRound: {
      groupName: "Spieltag",
      groupOrderID: 1,
      matches: [createFinishedMatch(1)],
    },
    groups,
    resolvedLeague: "dfb",
    effectiveShortcut: "dfb",
    resolvedSeason: 2026,
  });

  assert.equal(requestCount, 9);
  assert.equal(maxActiveRequests, 3);
  assert.equal(result.rateLimited, false);
});

test("getHomeSnapshot stops all group scans after the current round returns 429", async () => {
  const groups = createGroups(8, "1. Runde");
  let matchdayRequests = 0;
  const dataSource = createDataSource({
    getAvailableLeagues: async () => [
      {
        leagueShortcut: "dfb",
        leagueName: "DFB Pokal 2026/2027",
        leagueSeason: 2026,
        sport: { sportName: "Fußball" },
      },
    ],
    getCurrentGroup: async () => groups[groups.length - 1] as ApiGroup,
    getGroups: async () => groups,
    getMatchdayResults: async () => {
      matchdayRequests += 1;
      throw createStatusError(429);
    },
  });

  const snapshot = await getHomeSnapshot(
    { league: "dfb", season: "2026" },
    { dataSource, fallbackYear: 2025 }
  );

  assert.equal(matchdayRequests, 1);
  assert.equal(snapshot.bracketMatches.length, 0);
  assert.deepEqual(snapshot.errorKeys, ["matchday"]);
});

test("getHomeSnapshot stops before matchday scans when a primary request is rate limited", async () => {
  const groups = createGroups(2, "Spieltag");
  let matchdayRequests = 0;
  const dataSource = createDataSource({
    getAvailableLeagues: async () => [
      {
        leagueShortcut: "bl1",
        leagueName: "Bundesliga 2026/2027",
        leagueSeason: 2026,
        sport: { sportName: "Fußball" },
      },
    ],
    getCurrentGroup: async () => groups[0] as ApiGroup,
    getGroups: async () => groups,
    getTable: async () => {
      throw createStatusError(429);
    },
    getMatchdayResults: async () => {
      matchdayRequests += 1;
      return [];
    },
  });

  const snapshot = await getHomeSnapshot(
    { league: "bl1", season: "2026" },
    { dataSource, fallbackYear: 2026 }
  );

  assert.equal(matchdayRequests, 0);
  assert.equal(snapshot.rateLimited, true);
  assert.deepEqual(snapshot.errorKeys, ["table"]);
});

test("getGroupsWithFallback does not try an alternate shortcut after a 429", async () => {
  let groupRequests = 0;
  const dataSource = createDataSource({
    getGroups: async () => {
      groupRequests += 1;
      throw createStatusError(429);
    },
  });

  await assert.rejects(
    getGroupsWithFallback(dataSource, "cl", "ucl", 2026),
    (error: unknown) =>
      (error as { status?: number } | undefined)?.status === 429
  );
  assert.equal(groupRequests, 1);
});

test("getHomeSnapshot preserves an earlier matchday failure when a later round succeeds", async () => {
  const groups = createGroups(2, "Spieltag");
  const dataSource = createDataSource({
    getAvailableLeagues: async () => [
      {
        leagueShortcut: "dfb",
        leagueName: "DFB Pokal 2026/2027",
        leagueSeason: 2026,
        sport: { sportName: "Fußball" },
      },
    ],
    getCurrentGroup: async () => groups[0] as ApiGroup,
    getGroups: async () => groups,
    getMatchdayResults: async (...args) => {
      const groupOrderId = args[2];
      if (groupOrderId === 1) throw createStatusError(500);
      if (groupOrderId === 2) return [createFinishedMatch(2)];
      return [];
    },
  });

  const snapshot = await getHomeSnapshot(
    { league: "dfb", season: "2026" },
    { dataSource, fallbackYear: 2026 }
  );

  assert.equal(snapshot.currentRound.matches[0]?.matchID, 2);
  assert.equal(snapshot.errorKeys.includes("matchday"), true);
});

test("resolveRoundSnapshots preserves a failed candidate before a later success", async () => {
  const groups = createGroups(3, "Spieltag");
  const upcoming = {
    ...createFinishedMatch(3),
    matchIsFinished: false,
    matchResults: [],
  };
  const dataSource = createDataSource({
    getMatchdayResults: async (...args) => {
      const groupOrderId = args[2];
      if (groupOrderId === 2) throw createStatusError(500);
      if (groupOrderId === 3) return [upcoming];
      return [];
    },
  });

  const result = await resolveRoundSnapshots({
    dataSource,
    currentGroup: groups[0] as ApiGroup,
    currentRound: {
      groupName: "Spieltag",
      groupOrderID: 1,
      matches: [createFinishedMatch(1)],
    },
    groups,
    resolvedLeague: "dfb",
    effectiveShortcut: "dfb",
    resolvedSeason: 2026,
  });

  assert.equal(result.nextRound.matches[0]?.matchID, 3);
  assert.equal(result.errorKeys.includes("next matchday"), true);
});
