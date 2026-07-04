import assert from "node:assert/strict";
import test from "node:test";
import type { FootballDataSource } from "../src/home";
import {
  clearMatchdayCache,
  loadMatchdayResults,
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
}: Pick<FootballDataSource, "getLastChangeDate" | "getMatchdayResults">): FootballDataSource => ({
  getAvailableLeagues: async () => [],
  getAvailableLeaguesBySeason: async () => [],
  getAvailableTeams: async () => [],
  getCurrentGroup: async () => ({}),
  getGroupTable: async () => [],
  getGroups: async () => [],
  getAllMatches: async () => [],
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
