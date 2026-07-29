import assert from "node:assert/strict";
import test from "node:test";
import { getLiveSchedule, type LiveDataSource } from "../src/live";
import {
  type ApiLeague,
  type ApiMatch,
  type FetchOptions,
  OPENLIGADB_CACHE_SECONDS,
} from "../src/openligadb";

const NOW = new Date("2026-07-23T12:00:00.000Z");

const AVAILABLE_LEAGUES: ApiLeague[] = [
  {
    leagueShortcut: "bl1",
    leagueName: "Bundesliga",
    leagueSeason: 2026,
    sport: { sportName: "Fußball" },
  },
  {
    leagueShortcut: "bl2",
    leagueName: "Zweite Bundesliga",
    leagueSeason: 2026,
    sport: { sportName: "Fußball" },
  },
  {
    leagueShortcut: "ffb1",
    leagueName: "Frauen-Bundesliga",
    leagueSeason: 2026,
    sport: { sportName: "Fußball" },
  },
  {
    leagueShortcut: "dfb",
    leagueName: "DFB-Pokal",
    leagueSeason: 2026,
    sport: { sportName: "Fußball" },
  },
  {
    leagueShortcut: "ucl",
    leagueName: "Champions League",
    leagueSeason: 2026,
    sport: { sportName: "Football" },
  },
];

const createDataSource = (
  overrides: Partial<LiveDataSource> = {},
): LiveDataSource => ({
  getAvailableLeaguesBySeason: async () => AVAILABLE_LEAGUES,
  getAllMatches: async () => [],
  ...overrides,
});

const createMatch = ({
  finished = false,
  id,
  offsetMinutes,
}: {
  finished?: boolean;
  id: number;
  offsetMinutes: number;
}): ApiMatch => ({
  matchID: id,
  matchDateTimeUTC: new Date(
    NOW.getTime() + offsetMinutes * 60 * 1_000,
  ).toISOString(),
  matchIsFinished: finished,
  group: {
    groupName: "Spieltag",
    groupOrderID: 1,
  },
  team1: {
    teamId: id * 2,
    teamName: `Home ${id}`,
  },
  team2: {
    teamId: id * 2 + 1,
    teamName: `Away ${id}`,
  },
});

test("getLiveSchedule resolves current-season aliases and applies cache policies", async () => {
  const metadataCalls: Array<{
    season: number;
    options?: FetchOptions;
  }> = [];
  const scheduleCalls: Array<{
    shortcut: string;
    season: number;
    options?: FetchOptions;
  }> = [];
  const dataSource = createDataSource({
    getAvailableLeaguesBySeason: async (season, options) => {
      metadataCalls.push({ season, options });
      return AVAILABLE_LEAGUES;
    },
    getAllMatches: async (shortcut, season, options) => {
      scheduleCalls.push({ shortcut, season, options });
      return [];
    },
  });

  const result = await getLiveSchedule({ dataSource, now: NOW });

  assert.equal(result.checkedAt, NOW.getTime());
  assert.deepEqual(result.matches, []);
  assert.deepEqual(result.failedLeagues, []);
  assert.equal(metadataCalls.length, 1);
  assert.equal(metadataCalls[0]?.season, 2026);
  assert.equal(
    metadataCalls[0]?.options?.next?.revalidate,
    OPENLIGADB_CACHE_SECONDS.availableLeagues,
  );
  assert.deepEqual(
    scheduleCalls.map(({ shortcut, season }) => `${shortcut}:${season}`).sort(),
    ["bl1:2026", "bl2:2026", "dfb:2026", "ffb1:2026", "ucl:2026"],
  );
  assert.equal(
    scheduleCalls.every(
      ({ options }) =>
        options?.next?.revalidate === OPENLIGADB_CACHE_SECONDS.liveSchedule,
    ),
    true,
  );
  assert.equal(OPENLIGADB_CACHE_SECONDS.liveSchedule, 15 * 60);
});

test("getLiveSchedule selects recent unfinished matches and five upcoming globally", async () => {
  const schedules = new Map<string, ApiMatch[]>([
    [
      "bl1",
      [
        createMatch({ id: 102, offsetMinutes: -7 * 60 }),
        createMatch({ id: 101, offsetMinutes: -5 * 60 }),
        createMatch({ id: 205, offsetMinutes: 50 }),
      ],
    ],
    [
      "bl2",
      [
        createMatch({ id: 103, offsetMinutes: 0 }),
        createMatch({ id: 201, offsetMinutes: 10 }),
        createMatch({ id: 202, offsetMinutes: 20 }),
        createMatch({ id: 202, offsetMinutes: 20 }),
      ],
    ],
    [
      "ffb1",
      [
        createMatch({ finished: true, id: 104, offsetMinutes: -60 }),
        {
          ...createMatch({ id: 105, offsetMinutes: -30 }),
          matchDateTimeUTC: "not-a-date",
        },
        createMatch({ id: 203, offsetMinutes: 30 }),
      ],
    ],
    [
      "dfb",
      [
        createMatch({ id: 101, offsetMinutes: -4 * 60 }),
        createMatch({ id: 204, offsetMinutes: 40 }),
      ],
    ],
    ["ucl", [createMatch({ id: 206, offsetMinutes: 60 })]],
  ]);
  const dataSource = createDataSource({
    getAllMatches: async (shortcut) => schedules.get(shortcut) ?? [],
  });

  const result = await getLiveSchedule({ dataSource, now: NOW });

  assert.deepEqual(
    result.matches.map(({ match }) => match.matchID),
    [101, 101, 103, 201, 202, 203, 204, 205],
  );
  assert.deepEqual(
    result.matches
      .filter(({ match }) => match.matchID === 101)
      .map(({ league }) => league),
    ["bl1", "dfb"],
  );
  assert.equal(
    result.matches.filter(({ match }) => match.matchID === 202).length,
    1,
  );
  assert.equal(
    result.matches.some(({ match }) => match.matchID === 102),
    false,
  );
  assert.equal(
    result.matches.some(({ match }) => match.matchID === 104),
    false,
  );
  assert.equal(
    result.matches.some(({ match }) => match.matchID === 105),
    false,
  );
  assert.equal(
    result.matches.some(({ match }) => match.matchID === 206),
    false,
  );
});

test("getLiveSchedule caps concurrency and isolates failed competitions", async () => {
  let activeRequests = 0;
  let maxActiveRequests = 0;
  const dataSource = createDataSource({
    getAllMatches: async (shortcut) => {
      activeRequests += 1;
      maxActiveRequests = Math.max(maxActiveRequests, activeRequests);

      try {
        await new Promise((resolve) => setTimeout(resolve, 5));
        if (shortcut === "dfb") throw new Error("DFB unavailable");
        if (shortcut === "bl1") {
          return [createMatch({ id: 301, offsetMinutes: 15 })];
        }
        return [];
      } finally {
        activeRequests -= 1;
      }
    },
  });

  const result = await getLiveSchedule({ dataSource, now: NOW });

  assert.equal(maxActiveRequests, 3);
  assert.deepEqual(result.failedLeagues, ["dfb"]);
  assert.deepEqual(
    result.matches.map(({ match }) => match.matchID),
    [301],
  );
});

test("an unpublished Champions League schedule is a successful empty result", async () => {
  const calledShortcuts: string[] = [];
  const dataSource = createDataSource({
    getAllMatches: async (shortcut) => {
      calledShortcuts.push(shortcut);
      if (shortcut === "dfb") throw new Error("DFB unavailable");
      return [];
    },
  });

  const result = await getLiveSchedule({ dataSource, now: NOW });

  assert.equal(
    calledShortcuts.filter((shortcut) => shortcut === "ucl").length,
    1,
  );
  assert.equal(result.failedLeagues.includes("cl"), false);
  assert.deepEqual(result.failedLeagues, ["dfb"]);
  assert.deepEqual(result.matches, []);
});

test("getLiveSchedule times out a hung competition without failing the others", async () => {
  let bl1Signal: AbortSignal | undefined;
  const dataSource = createDataSource({
    getAllMatches: async (shortcut, _season, options) => {
      if (shortcut !== "bl1") return [];

      bl1Signal = options?.signal ?? undefined;
      return new Promise<ApiMatch[]>((_resolve, reject) => {
        options?.signal?.addEventListener(
          "abort",
          () => reject(new Error("aborted")),
          { once: true },
        );
      });
    },
  });

  const result = await getLiveSchedule({
    dataSource,
    now: NOW,
    requestTimeoutMs: 10,
  });

  assert.deepEqual(result.matches, []);
  assert.deepEqual(result.failedLeagues, ["bl1"]);
  assert.equal(bl1Signal?.aborted, true);
});

test("getLiveSchedule falls back to canonical shortcuts when metadata is unavailable", async () => {
  const shortcuts: string[] = [];
  const dataSource = createDataSource({
    getAvailableLeaguesBySeason: async () => {
      throw new Error("metadata unavailable");
    },
    getAllMatches: async (shortcut) => {
      shortcuts.push(shortcut);
      return [];
    },
  });

  const result = await getLiveSchedule({ dataSource, now: NOW });

  assert.deepEqual(result.failedLeagues, []);
  assert.deepEqual(shortcuts.sort(), ["bl1", "bl2", "dfb", "fbl1", "ucl"]);
});
