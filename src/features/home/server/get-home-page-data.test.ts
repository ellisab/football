import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate } from "node:timers/promises";
import type { FootballDataSource } from "@footballleagues/core/home";
import {
  getCurrentSeasonYear,
  LEAGUE_GROUPS,
} from "@footballleagues/core/leagues";
import type { ApiLeague } from "@footballleagues/core/openligadb";
import { getHomePageData } from "./get-home-page-data";

const league = (leagueShortcut: string, leagueSeason: number): ApiLeague => ({
  leagueShortcut,
  leagueSeason,
  sport: { sportName: "Football" },
});
const group = { groupOrderID: 1, groupName: "1. Spieltag" };
const finished = { matchID: 1, matchIsFinished: true, group };
const source = (
  overrides: Partial<FootballDataSource> = {},
): FootballDataSource => ({
  getAvailableLeagues: async () => [league("bl1", 2026), league("bl2", 2026)],
  getCurrentGroup: async () => group,
  getGroups: async () => [group],
  getMatchdayResults: async () => [finished],
  getMatchesByGroup: async () => [finished],
  getTable: async () => [{ teamInfoId: 7, teamName: "Team", points: 12 }],
  ...overrides,
});

test("overview shares metadata and starts other leagues before seed loading completes", {
  timeout: 2000,
}, async () => {
  const gate = Promise.withResolvers<void>();
  let metadataCalls = 0;
  const started: string[] = [];
  const pending = getHomePageData(
    {},
    {
      dataSource: source({
        getAvailableLeagues: async () => {
          metadataCalls++;
          return [league("bl1", 2026), league("bl2", 2026)];
        },
        getCurrentGroup: async (shortcut) => {
          started.push(shortcut);
          await gate.promise;
          return group;
        },
      }),
    },
  );
  try {
    await setImmediate();
    assert.deepEqual(started, ["bl1", "bl2"]);
    assert.equal(metadataCalls, 1);
  } finally {
    gate.resolve();
  }
  const data = await pending;
  assert.ok("competitions" in data);
  assert.deepEqual(
    data.competitions?.map(({ resolvedLeague }) => resolvedLeague),
    ["bl1", "bl2"],
  );
  assert.deepEqual(data.visibleErrors, []);
  assert.equal(metadataCalls, 1);
});

test("overview retains default-league fallback and each competition's latest season", async () => {
  const data = await getHomePageData(
    {},
    {
      dataSource: source({
        getAvailableLeagues: async () => [
          league("bl2", 2024),
          league("bl2", 2026),
          league("dfb", 2025),
        ],
      }),
    },
  );
  assert.equal(data.resolvedLeague, "bl2");
  assert.ok("competitions" in data);
  assert.deepEqual(
    data.competitions?.map(({ resolvedLeague, resolvedSeason }) => [
      resolvedLeague,
      resolvedSeason,
    ]),
    [
      ["bl2", 2026],
      ["dfb", 2025],
    ],
  );
  assert.deepEqual(data.leagueOptions[0]?.seasons, [2026]);
});

test("single-competition requests retain explicit season selection", async () => {
  const requests: number[] = [];
  const data = await getHomePageData(
    { league: "bl1", season: "2025" },
    {
      dataSource: source({
        getAvailableLeagues: async () => [
          league("bl1", 2025),
          league("bl1", 2026),
        ],
        getTable: async (_shortcut, season) => {
          requests.push(season);
          return [];
        },
      }),
    },
  );
  assert.equal(data.resolvedSeason, 2025);
  assert.equal("competitions" in data, false);
  assert.deepEqual(requests, [2025]);
});

test("failed seed retains fallback options while healthy competitions remain available", async (t) => {
  t.mock.method(console, "warn", () => {});
  const season = getCurrentSeasonYear();
  const started: string[] = [];
  const data = await getHomePageData(
    {},
    {
      dataSource: source({
        getAvailableLeagues: async () => [
          league("bl1", season),
          league("bl2", season),
        ],
        getCurrentGroup: async (shortcut) => {
          started.push(shortcut);
          if (shortcut === "bl1") throw new Error("Seed unavailable");
          return group;
        },
      }),
    },
  );
  assert.ok("competitions" in data);
  assert.deepEqual(
    data.competitions?.map(({ resolvedLeague }) => resolvedLeague),
    LEAGUE_GROUPS.map(({ key }) => key),
  );
  assert.equal(
    data.competitions?.find(({ resolvedLeague }) => resolvedLeague === "bl2")
      ?.visibleErrors.length,
    0,
  );
  assert.equal(started.filter((shortcut) => shortcut === "bl2").length, 1);
  assert.equal(data.visibleErrors.length, 1);
});

test("overview isolates a failed non-seed competition", async (t) => {
  t.mock.method(console, "warn", () => {});
  const data = await getHomePageData(
    {},
    {
      dataSource: source({
        getCurrentGroup: async (shortcut) => {
          if (shortcut === "bl2") throw new Error("Unavailable");
          return group;
        },
      }),
    },
  );
  assert.ok("competitions" in data);
  assert.deepEqual(
    data.competitions?.map(({ resolvedLeague, visibleErrors }) => [
      resolvedLeague,
      visibleErrors.length,
    ]),
    [
      ["bl1", 0],
      ["bl2", 1],
    ],
  );
});

test("other competitions can recover when the initial metadata request fails", async (t) => {
  t.mock.method(console, "warn", () => {});
  let attempts = 0;
  const data = await getHomePageData(
    {},
    {
      dataSource: source({
        getAvailableLeagues: async () => {
          if (++attempts === 1) throw new Error("Temporary metadata outage");
          return LEAGUE_GROUPS.map(({ key }) =>
            league(key, getCurrentSeasonYear()),
          );
        },
      }),
    },
  );
  assert.ok("competitions" in data);
  assert.equal(data.competitions?.[0]?.visibleErrors.length, 1);
  assert.ok(
    data.competitions
      ?.slice(1)
      .every(({ visibleErrors }) => visibleErrors.length === 0),
  );
});

test("persistent metadata failure retains the full fallback overview", async (t) => {
  t.mock.method(console, "warn", () => {});
  let metadataCalls = 0;
  let fixtureCalls = 0;
  const data = await getHomePageData(
    {},
    {
      dataSource: source({
        getAvailableLeagues: async () => {
          metadataCalls++;
          throw new Error("Unavailable");
        },
        getCurrentGroup: async () => {
          fixtureCalls++;
          return group;
        },
      }),
    },
  );
  assert.ok("competitions" in data);
  assert.equal(metadataCalls, LEAGUE_GROUPS.length);
  assert.equal(fixtureCalls, 0);
  assert.deepEqual(
    data.competitions?.map(({ resolvedLeague }) => resolvedLeague),
    LEAGUE_GROUPS.map(({ key }) => key),
  );
  assert.ok(
    data.competitions?.every(({ visibleErrors }) => visibleErrors.length === 1),
  );
});
