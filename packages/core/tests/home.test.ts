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
  responder: (path: string) => Response | Promise<Response>
) => {
  return async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    return responder(new URL(url).pathname);
  };
};

const createFinishedMatch = (
  matchID: number,
  team1Id: number,
  team1Name: string,
  team2Id: number,
  team2Name: string
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
  team2Name: string
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
];

test("getHomeSnapshot promotes the latest completed future round and exposes the next round", async () => {
  const originalFetch = globalThis.fetch;
  const table: ApiTableRow[] = [{ teamInfoId: 1, teamName: "Team A", points: 20 }];

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
        return jsonResponse([createUpcomingMatch(10, 1, "Team A", 2, "Team B")]);
      case "/getgroups/bl1/2025":
        return jsonResponse([
          { groupID: 10, groupName: "10. Spieltag", groupOrderID: 10 },
          { groupID: 11, groupName: "11. Spieltag", groupOrderID: 11 },
          { groupID: 12, groupName: "12. Spieltag", groupOrderID: 12 },
        ]);
      case "/getmatchdata/bl1/2025/11":
        return jsonResponse([createFinishedMatch(11, 3, "Team C", 4, "Team D")]);
      case "/getmatchdata/bl1/2025/12":
        return jsonResponse([createUpcomingMatch(12, 5, "Team E", 6, "Team F")]);
      default:
        return jsonResponse({ path }, 404);
    }
  });

  try {
    const snapshot = await getHomeSnapshot({ league: "bl1", season: "2025" });

    assert.equal(snapshot.currentRound.groupOrderID, 11);
    assert.equal(snapshot.currentRound.groupName, "11. Spieltag");
    assert.equal(snapshot.nextRound.groupOrderID, 12);
    assert.equal(snapshot.nextRound.groupName, "12. Spieltag");
    assert.equal(snapshot.table.length, 1);
    assert.deepEqual(snapshot.errorKeys, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getHomeSnapshot reports structured error keys when table and future rounds fail", async () => {
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
        return jsonResponse([createUpcomingMatch(50, 1, "Team A", 2, "Team B")]);
      case "/getgroups/bl1/2025":
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
    assert.deepEqual(
      [...snapshot.errorKeys].sort(),
      ["next groups", "next matchday", "table"]
    );
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
    leagueOptions: [{ shortcut: "cl", label: "Champions League 2025/2026", seasons: [2025] }],
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

  assert.equal(state.isChampionsLeaguePlayoffRound, true);
  assert.deepEqual(
    state.sections.map((section) => section.key),
    ["next-round", "table"]
  );
  assert.equal(state.sections[0]?.renderKind, "ties");
  assert.deepEqual(state.errorKeys, ["table", "next matchday"]);
  assert.equal(state.usesKnockoutLabels, true);
});
