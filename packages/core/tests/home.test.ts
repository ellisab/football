import assert from "node:assert/strict";
import test from "node:test";
import {
  createHomeState,
  getHomeSnapshot,
  type HomeSnapshot,
} from "../src/home";
import type { ApiMatch, ApiTableRow } from "../src/openligadb";

const jsonResponse = (body: unknown, status: number = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
};

const createFetchMock = (
  responder: (path: string) => Response | Promise<Response>,
) => {
  return async (input: RequestInfo | URL): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    return responder(new URL(url).pathname);
  };
};

const createFinishedMatch = (
  matchID: number,
  team1Id: number,
  team1Name: string,
  team2Id: number,
  team2Name: string,
): ApiMatch => ({
  matchID,
  matchDateTimeUTC: "2026-03-01T20:00:00Z",
  team1: { teamId: team1Id, teamName: team1Name },
  team2: { teamId: team2Id, teamName: team2Name },
  matchIsFinished: true,
  matchResults: [{ resultTypeID: 2, pointsTeam1: 2, pointsTeam2: 1 }],
});

const createUpcomingMatch = (
  matchID: number,
  team1Id: number,
  team1Name: string,
  team2Id: number,
  team2Name: string,
): ApiMatch => ({
  matchID,
  matchDateTimeUTC: "2026-03-08T20:00:00Z",
  team1: { teamId: team1Id, teamName: team1Name },
  team2: { teamId: team2Id, teamName: team2Name },
  matchIsFinished: false,
  matchResults: [],
});

const LEAGUES_RESPONSE = [
  {
    leagueShortcut: "bl1",
    leagueName: "Fußball-Bundesliga 2025/2026",
    leagueSeason: 2025,
    sport: { sportName: "Fußball" },
  },
  {
    leagueShortcut: "cl",
    leagueName: "UEFA Champions League 2025/2026",
    leagueSeason: 2025,
    sport: { sportName: "Football" },
  },
  {
    leagueShortcut: "dfb-international",
    leagueName: "DFB-Pokal International 2025/2026",
    leagueSeason: 2025,
    sport: { sportName: "Fußball" },
  },
];

test("getHomeSnapshot defaults to Bundesliga when no league is requested", async () => {
  const originalFetch = globalThis.fetch;
  const paths: string[] = [];

  globalThis.fetch = createFetchMock((path) => {
    paths.push(path);

    switch (path) {
      case "/getavailableleagues":
        return jsonResponse(LEAGUES_RESPONSE);
      default:
        return jsonResponse({ path }, 404);
    }
  });

  try {
    const snapshot = await getHomeSnapshot({});

    assert.equal(snapshot.resolvedLeague, "bl1");
    assert.equal(snapshot.resolvedSeason, 2025);
    assert.equal(snapshot.hasTable, true);
    assert.deepEqual(
      snapshot.leagueOptions.map((option) => option.shortcut),
      ["bl1", "cl"],
    );
    assert.equal(
      paths.some((path) => path.includes("dfb-international")),
      false,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getHomeSnapshot rejects unsupported league keys before loading data", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;

  globalThis.fetch = async () => {
    fetchCalled = true;
    return jsonResponse({});
  };

  try {
    await assert.rejects(
      getHomeSnapshot({ league: "unsupported", season: "2026" }),
      /unsupported league/i,
    );
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getHomeSnapshot keeps an unfinished Bundesliga matchday current", async () => {
  const originalFetch = globalThis.fetch;
  const table: ApiTableRow[] = [
    { teamInfoId: 1, teamName: "Team A", points: 20 },
  ];

  globalThis.fetch = createFetchMock((path) => {
    switch (path) {
      case "/getavailableleagues":
        return jsonResponse(LEAGUES_RESPONSE);
      case "/getcurrentgroup/bl1":
        return jsonResponse({
          groupID: 10,
          groupName: "10. Spieltag",
          groupOrderID: 10,
        });
      case "/getbltable/bl1/2025":
        return jsonResponse(table);
      case "/getmatchdata/bl1/2025/10":
        return jsonResponse([
          createUpcomingMatch(10, 1, "Team A", 2, "Team B"),
        ]);
      case "/getavailablegroups/bl1/2025":
        return jsonResponse([
          { groupID: 10, groupName: "10. Spieltag", groupOrderID: 10 },
          { groupID: 11, groupName: "11. Spieltag", groupOrderID: 11 },
        ]);
      case "/getmatchdata/bl1/2025/11":
        return jsonResponse([
          createUpcomingMatch(11, 3, "Team C", 4, "Team D"),
        ]);
      default:
        return jsonResponse({ path }, 404);
    }
  });

  try {
    const snapshot = await getHomeSnapshot({ league: "bl1", season: "2025" });

    assert.equal(snapshot.currentRound.groupOrderID, 10);
    assert.equal(snapshot.currentRound.groupName, "10. Spieltag");
    assert.equal(snapshot.nextRound.matches.length, 0);
    assert.equal(snapshot.table.length, 1);
    assert.deepEqual(snapshot.errorKeys, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getHomeSnapshot exposes the next Bundesliga matchday after the current one is finished", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = createFetchMock((path) => {
    switch (path) {
      case "/getavailableleagues":
        return jsonResponse(LEAGUES_RESPONSE);
      case "/getcurrentgroup/bl1":
        return jsonResponse({
          groupID: 10,
          groupName: "10. Spieltag",
          groupOrderID: 10,
        });
      case "/getbltable/bl1/2025":
        return jsonResponse([]);
      case "/getavailablegroups/bl1/2025":
        return jsonResponse([
          { groupID: 10, groupName: "10. Spieltag", groupOrderID: 10 },
          { groupID: 11, groupName: "11. Spieltag", groupOrderID: 11 },
        ]);
      case "/getmatchdata/bl1/2025/10":
        return jsonResponse([
          createFinishedMatch(10, 1, "Team A", 2, "Team B"),
        ]);
      case "/getmatchdata/bl1/2025/11":
        return jsonResponse([
          createUpcomingMatch(11, 3, "Team C", 4, "Team D"),
        ]);
      default:
        return jsonResponse({ path }, 404);
    }
  });

  try {
    const snapshot = await getHomeSnapshot({ league: "bl1", season: "2025" });

    assert.equal(snapshot.currentRound.groupOrderID, 10);
    assert.equal(snapshot.currentRound.groupName, "10. Spieltag");
    assert.equal(snapshot.nextRound.groupOrderID, 11);
    assert.equal(snapshot.nextRound.groupName, "11. Spieltag");
    assert.deepEqual(snapshot.errorKeys, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getHomeSnapshot does not rescan previous Bundesliga groups when the current group is finished", async () => {
  const originalFetch = globalThis.fetch;
  const paths: string[] = [];

  globalThis.fetch = createFetchMock((path) => {
    paths.push(path);

    switch (path) {
      case "/getavailableleagues":
        return jsonResponse(LEAGUES_RESPONSE);
      case "/getcurrentgroup/bl1":
        return jsonResponse({
          groupID: 3,
          groupName: "3. Spieltag",
          groupOrderID: 3,
        });
      case "/getbltable/bl1/2025":
        return jsonResponse([]);
      case "/getavailablegroups/bl1/2025":
        return jsonResponse([
          { groupID: 1, groupName: "1. Spieltag", groupOrderID: 1 },
          { groupID: 2, groupName: "2. Spieltag", groupOrderID: 2 },
          { groupID: 3, groupName: "3. Spieltag", groupOrderID: 3 },
        ]);
      case "/getmatchdata/bl1/2025/3":
        return jsonResponse([createFinishedMatch(3, 1, "Team A", 2, "Team B")]);
      default:
        return jsonResponse({ path }, 404);
    }
  });

  try {
    const snapshot = await getHomeSnapshot({ league: "bl1", season: "2025" });

    assert.equal(snapshot.currentRound.groupOrderID, 3);
    assert.equal(snapshot.currentRound.groupName, "3. Spieltag");
    assert.equal(paths.includes("/getmatchdata/bl1/2025/1"), false);
    assert.equal(paths.includes("/getmatchdata/bl1/2025/2"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

const BUNDESLIGA_FAMILY_CASES = [
  {
    league: "bl1",
    leagueName: "1. Fußball-Bundesliga 2026/2027",
    shortcut: "bl1",
  },
  {
    league: "bl2",
    leagueName: "2. Fußball-Bundesliga 2026/2027",
    shortcut: "bl2",
  },
  {
    league: "fbl1",
    leagueName: "1. Frauen-Bundesliga 2026/2027",
    shortcut: "fbl1",
  },
] as const;

for (const { league, leagueName, shortcut } of BUNDESLIGA_FAMILY_CASES) {
  test(`getHomeSnapshot starts ${league} future seasons at the first unfinished matchday`, async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = createFetchMock((path) => {
      switch (path) {
        case "/getavailableleagues":
          return jsonResponse([
            {
              leagueShortcut: shortcut,
              leagueName,
              leagueSeason: 2026,
              sport: { sportName: "Fußball" },
            },
          ]);
        case `/getcurrentgroup/${shortcut}`:
          return jsonResponse({
            groupID: 34,
            groupName: "34. Spieltag",
            groupOrderID: 34,
          });
        case `/getavailablegroups/${shortcut}/2026`:
          return jsonResponse([
            { groupID: 1, groupName: "1. Spieltag", groupOrderID: 1 },
            { groupID: 2, groupName: "2. Spieltag", groupOrderID: 2 },
            { groupID: 34, groupName: "34. Spieltag", groupOrderID: 34 },
          ]);
        case `/getbltable/${shortcut}/2026`:
          return jsonResponse([]);
        case `/getmatchdata/${shortcut}/2026/1`:
          return jsonResponse([
            createUpcomingMatch(1, 1, "Team A", 2, "Team B"),
          ]);
        case `/getmatchdata/${shortcut}/2026/34`:
          return jsonResponse([
            createUpcomingMatch(34, 3, "Team C", 4, "Team D"),
          ]);
        default:
          return jsonResponse({ path }, 404);
      }
    });

    try {
      const snapshot = await getHomeSnapshot(
        { league, season: "2026" },
        { fallbackYear: 2026 },
      );

      assert.equal(snapshot.resolvedLeague, league);
      assert.equal(snapshot.resolvedSeason, 2026);
      assert.equal(snapshot.currentRound.groupOrderID, 1);
      assert.equal(snapshot.currentRound.groupName, "1. Spieltag");
      assert.equal(snapshot.nextRound.matches.length, 0);
      assert.deepEqual(snapshot.errorKeys, []);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}

test("getHomeSnapshot reports data errors without probing future Bundesliga rounds while current is unfinished", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = createFetchMock((path) => {
    switch (path) {
      case "/getavailableleagues":
        return jsonResponse(LEAGUES_RESPONSE);
      case "/getcurrentgroup/bl1":
        return jsonResponse({
          groupID: 5,
          groupName: "5. Spieltag",
          groupOrderID: 5,
        });
      case "/getbltable/bl1/2025":
        return jsonResponse({ message: "boom" }, 500);
      case "/getmatchdata/bl1/2025/5":
        return jsonResponse([
          createUpcomingMatch(50, 1, "Team A", 2, "Team B"),
        ]);
      case "/getavailablegroups/bl1/2025":
        return jsonResponse({ message: "groups failed" }, 500);
      case "/getmatchdata/bl1/2025/6":
        return jsonResponse({ message: "future round failed" }, 500);
      default:
        if (path.startsWith("/getmatchdata/bl1/2025/")) {
          return jsonResponse({ path }, 404);
        }
        return jsonResponse({ path }, 404);
    }
  });

  try {
    const snapshot = await getHomeSnapshot({ league: "bl1", season: "2025" });

    assert.equal(snapshot.currentRound.groupOrderID, 5);
    assert.equal(snapshot.nextRound.matches.length, 0);
    assert.deepEqual([...snapshot.errorKeys].sort(), ["groups", "table"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getHomeSnapshot uses the first populated round for a future DFB season", async () => {
  const originalFetch = globalThis.fetch;
  const roundOneMatch = createUpcomingMatch(
    401,
    1,
    "VSG Altglienicke Berlin",
    2,
    "VfL Wolfsburg",
  );

  globalThis.fetch = createFetchMock((path) => {
    switch (path) {
      case "/getavailableleagues":
        return jsonResponse([
          {
            leagueShortcut: "dfb",
            leagueName: "DFB Pokal 2026/2027",
            leagueSeason: 2026,
            sport: { sportName: "Fußball" },
          },
        ]);
      case "/getcurrentgroup/dfb":
        return jsonResponse({
          groupID: 60,
          groupName: "Endspiel",
          groupOrderID: 6,
        });
      case "/getavailablegroups/dfb/2026":
        return jsonResponse([
          { groupID: 10, groupName: "1. Runde", groupOrderID: 1 },
          { groupID: 60, groupName: "Endspiel", groupOrderID: 6 },
        ]);
      case "/getmatchdata/dfb/2026/1":
        return jsonResponse([roundOneMatch]);
      case "/getmatchdata/dfb/2026/6":
        return jsonResponse([]);
      default:
        return jsonResponse({ path }, 404);
    }
  });

  try {
    const snapshot = await getHomeSnapshot(
      { league: "dfb", season: "2026" },
      { fallbackYear: 2025 },
    );

    assert.equal(snapshot.resolvedSeason, 2026);
    assert.equal(snapshot.currentRound.groupOrderID, 1);
    assert.equal(snapshot.currentRound.groupName, "1. Runde");
    assert.deepEqual(
      snapshot.currentRound.matches.map((match) => match.matchID),
      [401],
    );
    assert.equal(snapshot.nextRound.matches.length, 0);
    assert.deepEqual(snapshot.errorKeys, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getHomeSnapshot keeps an empty first round shell for a future league season without fixtures", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = createFetchMock((path) => {
    switch (path) {
      case "/getavailableleagues":
        return jsonResponse([
          {
            leagueShortcut: "bl1",
            leagueName: "1. Fußball-Bundesliga 2026/2027",
            leagueSeason: 2026,
            sport: { sportName: "Fußball" },
          },
        ]);
      case "/getcurrentgroup/bl1":
        return jsonResponse({
          groupID: 34,
          groupName: "34. Spieltag",
          groupOrderID: 34,
        });
      case "/getavailablegroups/bl1/2026":
        return jsonResponse([
          { groupID: 1, groupName: "1. Spieltag", groupOrderID: 1 },
          { groupID: 2, groupName: "2. Spieltag", groupOrderID: 2 },
          { groupID: 34, groupName: "34. Spieltag", groupOrderID: 34 },
        ]);
      case "/getbltable/bl1/2026":
      case "/getmatchdata/bl1/2026/1":
      case "/getmatchdata/bl1/2026/2":
      case "/getmatchdata/bl1/2026/34":
        return jsonResponse([]);
      default:
        return jsonResponse({ path }, 404);
    }
  });

  try {
    const snapshot = await getHomeSnapshot(
      { league: "bl1", season: "2026" },
      { fallbackYear: 2025 },
    );

    assert.equal(snapshot.resolvedSeason, 2026);
    assert.equal(snapshot.currentRound.groupOrderID, 1);
    assert.equal(snapshot.currentRound.groupName, "1. Spieltag");
    assert.equal(snapshot.currentRound.matches.length, 0);
    assert.equal(snapshot.nextRound.matches.length, 0);
    assert.equal(snapshot.table.length, 0);
    assert.deepEqual(snapshot.errorKeys, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getHomeSnapshot falls back to the latest available women season when 2026 is missing", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = createFetchMock((path) => {
    switch (path) {
      case "/getavailableleagues":
        return jsonResponse([
          {
            leagueShortcut: "fbl1",
            leagueName: "1. Frauen-Bundesliga 2025",
            leagueSeason: 2025,
            sport: { sportName: "Frauenfußball" },
          },
        ]);
      case "/getcurrentgroup/fbl1":
        return jsonResponse({
          groupID: 22,
          groupName: "22. Spieltag",
          groupOrderID: 22,
        });
      case "/getavailablegroups/fbl1/2025":
        return jsonResponse([
          { groupID: 22, groupName: "22. Spieltag", groupOrderID: 22 },
        ]);
      case "/getbltable/fbl1/2025":
      case "/getmatchdata/fbl1/2025/22":
        return jsonResponse([]);
      default:
        return jsonResponse({ path }, 404);
    }
  });

  try {
    const snapshot = await getHomeSnapshot(
      { league: "fbl1", season: "2026" },
      { fallbackYear: 2025 },
    );

    assert.equal(snapshot.resolvedLeague, "fbl1");
    assert.equal(snapshot.resolvedSeason, 2025);
    assert.deepEqual(snapshot.leagueOptions[0]?.seasons, [2025]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getHomeSnapshot skips Champions League future-round probing when the first scheduled group is empty", async () => {
  const originalFetch = globalThis.fetch;
  const paths: string[] = [];

  globalThis.fetch = createFetchMock((path) => {
    paths.push(path);

    switch (path) {
      case "/getavailableleagues":
        return jsonResponse([
          {
            leagueShortcut: "ucl",
            leagueName: "UEFA Champions League 2026/2027",
            leagueSeason: 2026,
            sport: { sportName: "Football" },
          },
        ]);
      case "/getcurrentgroup/ucl":
        return jsonResponse({
          groupID: 1,
          groupName: "1. Spieltag",
          groupOrderID: 1,
        });
      case "/getbltable/ucl/2026":
        return jsonResponse([]);
      case "/getavailablegroups/cl/2026":
        return jsonResponse({ path }, 404);
      case "/getavailablegroups/ucl/2026":
        return jsonResponse([
          { groupID: 1, groupName: "1. Spieltag", groupOrderID: 1 },
          { groupID: 2, groupName: "2. Spieltag", groupOrderID: 2 },
          { groupID: 3, groupName: "3. Spieltag", groupOrderID: 3 },
        ]);
      case "/getmatchdata/ucl/2026/1":
      case "/getmatchdata/ucl/2026/2":
      case "/getmatchdata/ucl/2026/3":
      case "/getmatchdata/ucl/2026/9":
        return jsonResponse([]);
      default:
        return jsonResponse({ path }, 404);
    }
  });

  try {
    const snapshot = await getHomeSnapshot(
      { league: "cl", season: "2026" },
      { fallbackYear: 2026 },
    );

    assert.equal(snapshot.currentRound.groupOrderID, 1);
    assert.equal(snapshot.nextRound.matches.length, 0);
    assert.equal(
      paths.filter((path) => path === "/getmatchdata/ucl/2026/2").length,
      1,
    );
    assert.equal(
      paths.filter((path) => path === "/getmatchdata/ucl/2026/3").length,
      1,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getHomeSnapshot merges both Champions League legs into the current round and skips to the next stage", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = createFetchMock((path) => {
    switch (path) {
      case "/getavailableleagues":
        return jsonResponse([
          {
            leagueShortcut: "ucl",
            leagueName: "Champions League 2025/2026",
            leagueSeason: 2025,
            sport: { sportName: "Football" },
          },
        ]);
      case "/getcurrentgroup/ucl":
        return jsonResponse({
          groupID: 10,
          groupName: "Achtelfinale Hinspiele",
          groupOrderID: 10,
        });
      case "/getavailablegroups/cl/2025":
        return jsonResponse({ message: "not found" }, 404);
      case "/getavailablegroups/ucl/2025":
        return jsonResponse({ message: "not found" }, 404);
      case "/getmatchdata/ucl/2025/9":
        return jsonResponse([
          {
            ...createFinishedMatch(100, 5, "Club E", 6, "Club F"),
            group: { groupName: "Playoffs", groupOrderID: 9, groupID: 9 },
          },
        ]);
      case "/getmatchdata/ucl/2025/10":
        return jsonResponse([
          {
            ...createUpcomingMatch(101, 1, "Club A", 2, "Club B"),
            group: {
              groupName: "Achtelfinale Hinspiele",
              groupOrderID: 10,
              groupID: 10,
            },
          },
        ]);
      case "/getmatchdata/ucl/2025/11":
        return jsonResponse([
          {
            ...createUpcomingMatch(102, 2, "Club B", 1, "Club A"),
            group: {
              groupName: "Achtelfinale Rückspiele",
              groupOrderID: 11,
              groupID: 11,
            },
          },
        ]);
      case "/getmatchdata/ucl/2025/12":
        return jsonResponse([
          {
            ...createUpcomingMatch(103, 3, "Club C", 4, "Club D"),
            group: {
              groupName: "Viertelfinale Hinspiele",
              groupOrderID: 12,
              groupID: 12,
            },
          },
        ]);
      case "/getmatchdata/ucl/2025/13":
        return jsonResponse([
          {
            ...createUpcomingMatch(104, 4, "Club D", 3, "Club C"),
            group: {
              groupName: "Viertelfinale Rückspiele",
              groupOrderID: 13,
              groupID: 13,
            },
          },
        ]);
      case "/getbltable/ucl/2025":
        return jsonResponse([]);
      default:
        return jsonResponse({ path }, 404);
    }
  });

  try {
    const snapshot = await getHomeSnapshot({ league: "cl", season: "2025" });

    assert.equal(snapshot.currentRound.groupName, "Achtelfinale");
    assert.equal(snapshot.currentRound.groupOrderID, 10);
    assert.equal(snapshot.currentRound.matches.length, 2);
    assert.deepEqual(
      snapshot.currentRound.matches.map((match) => match.matchID),
      [101, 102],
    );
    assert.equal(snapshot.nextRound.groupName, "Viertelfinale");
    assert.equal(snapshot.nextRound.groupOrderID, 12);
    assert.deepEqual(
      snapshot.nextRound.matches.map((match) => match.matchID),
      [103, 104],
    );
    assert.equal(snapshot.bracketMatches.length, 1);
    assert.equal(snapshot.bracketMatches[0]?.group.groupName, "Achtelfinale");
    assert.deepEqual(
      snapshot.bracketMatches[0]?.matches.map((match) => match.matchID),
      [101, 102],
    );
    assert.deepEqual(snapshot.errorKeys, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("createHomeState centralizes section shaping for Champions League playoff rounds", () => {
  const playoffMatches = [
    createFinishedMatch(201, 1, "Club A", 2, "Club B"),
    {
      ...createFinishedMatch(202, 2, "Club B", 1, "Club A"),
      matchDateTimeUTC: "2026-03-08T20:00:00Z",
      matchResults: [{ resultTypeID: 2, pointsTeam1: 1, pointsTeam2: 0 }],
    },
  ];

  const snapshot: HomeSnapshot = {
    resolvedLeague: "cl",
    resolvedSeason: 2025,
    leagueOptions: [
      { shortcut: "cl", label: "Champions League 2025/2026", seasons: [2025] },
    ],
    currentRound: {
      groupName: "Playoffs",
      groupOrderID: 9,
      matches: playoffMatches,
    },
    nextRound: {
      groupName: "Round of 16",
      groupOrderID: 10,
      matches: [createUpcomingMatch(203, 3, "Club C", 4, "Club D")],
    },
    hasTable: true,
    bracketMatches: [
      {
        group: { groupID: 9, groupName: "Playoffs", groupOrderID: 9 },
        matches: playoffMatches,
      },
    ],
    table: [{ teamInfoId: 7, teamName: "Club A", points: 9 }],
    errorKeys: ["table", "next matchday"],
  };

  const state = createHomeState(snapshot);

  assert.equal(state.isChampionsLeaguePlayoffRound, false);
  assert.equal(state.bracketMatches.length, 0);
  assert.deepEqual(
    state.sections.map((section) => section.key),
    ["next-round", "matchday", "table"],
  );
  assert.equal(state.sections[0]?.renderKind, "ties");
  assert.equal(state.sections[1]?.renderKind, "ties");
  assert.deepEqual(state.errorKeys, ["table", "next matchday"]);
  assert.equal(state.usesKnockoutLabels, true);
});

test("createHomeState removes visible DFB knockout stages from the bracket to avoid duplicate UI sections", () => {
  const snapshot: HomeSnapshot = {
    resolvedLeague: "dfb",
    resolvedSeason: 2025,
    leagueOptions: [
      { shortcut: "dfb", label: "DFB-Pokal 2025/2026", seasons: [2025] },
    ],
    currentRound: {
      groupName: "Halbfinale",
      groupOrderID: 5,
      matches: [createFinishedMatch(301, 1, "Club A", 2, "Club B")],
    },
    nextRound: {
      groupName: "Finale",
      groupOrderID: 6,
      matches: [createUpcomingMatch(302, 3, "Club C", 4, "Club D")],
    },
    hasTable: false,
    bracketMatches: [
      {
        group: { groupID: 4, groupName: "Viertelfinale", groupOrderID: 4 },
        matches: [createFinishedMatch(300, 10, "Club Q", 11, "Club R")],
      },
      {
        group: { groupID: 5, groupName: "Halbfinale", groupOrderID: 5 },
        matches: [createFinishedMatch(301, 1, "Club A", 2, "Club B")],
      },
      {
        group: { groupID: 6, groupName: "Finale", groupOrderID: 6 },
        matches: [createUpcomingMatch(302, 3, "Club C", 4, "Club D")],
      },
    ],
    table: [],
    errorKeys: [],
  };

  const state = createHomeState(snapshot);

  assert.deepEqual(
    state.bracketMatches.map((round) => round.group.groupName),
    ["Viertelfinale"],
  );
  assert.deepEqual(
    state.sections.map((section) => section.key),
    ["next-round", "matchday"],
  );
  assert.equal(state.usesKnockoutLabels, true);
});
