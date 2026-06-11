import assert from "node:assert/strict";
import test from "node:test";
import { getFinalResult } from "../src/openligadb";
import type { ApiLeague, ApiMatch } from "../src/openligadb";
import {
  createWorldCupSnapshot,
  deriveGroupStandings,
  discoverWorldCupLeague,
  getWorldCupSnapshot,
  type WorldCupDataSource,
} from "../src/world-cup";

const createMatch = ({
  matchID,
  groupName,
  groupOrderID,
  team1,
  team2,
  score,
  finished = true,
}: {
  matchID: number;
  groupName: string;
  groupOrderID: number;
  team1: { teamId: number; teamName: string; teamGroupName?: string };
  team2: { teamId: number; teamName: string; teamGroupName?: string };
  score?: [number, number];
  finished?: boolean;
}): ApiMatch => ({
  matchID,
  matchDateTimeUTC: `2026-06-${String(matchID).padStart(2, "0")}T18:00:00Z`,
  lastUpdateDateTime: `2026-06-${String(matchID).padStart(2, "0")}T20:00:00Z`,
  group: { groupName, groupOrderID },
  team1,
  team2,
  matchIsFinished: finished,
  matchResults: score
    ? [
        {
          resultOrderID: 1,
          resultTypeID: 1,
          pointsTeam1: 0,
          pointsTeam2: 0,
        },
        {
          resultOrderID: 2,
          resultTypeID: 2,
          pointsTeam1: score[0],
          pointsTeam2: score[1],
        },
      ]
    : [],
});

test("discoverWorldCupLeague finds the 2026 football World Cup without hardcoding the shortcut", () => {
  const leagues: ApiLeague[] = [
    {
      leagueShortcut: "bl1",
      leagueName: "1. Fussball-Bundesliga",
      leagueSeason: 2026,
      sport: { sportName: "Fußball" },
    },
    {
      leagueShortcut: "fwm2026",
      leagueName: "Frauen WM 2026",
      leagueSeason: 2026,
      sport: { sportName: "Fußball" },
    },
    {
      leagueShortcut: "fifa-wc-2026",
      leagueName: "FIFA World Cup 2026",
      leagueSeason: "2026",
      sport: { sportName: "Football" },
    },
  ];

  const league = discoverWorldCupLeague(leagues, 2026);

  assert.equal(league?.leagueShortcut, "fifa-wc-2026");
});

test("discoverWorldCupLeague prefers the established league when a duplicate is added", () => {
  const league = discoverWorldCupLeague(
    [
      {
        leagueId: 4949,
        leagueShortcut: "wm2026_xlife",
        leagueName: "FIFA World Cup 2026",
        leagueSeason: 2026,
        sport: { sportName: "Fußball" },
      },
      {
        leagueId: 4897,
        leagueShortcut: "wm26",
        leagueName: "WM 2026",
        leagueSeason: 2026,
        sport: { sportName: "Fußball" },
      },
    ],
    2026
  );

  assert.equal(league?.leagueShortcut, "wm26");
});

test("getFinalResult prefers the result with the highest resultOrderID", () => {
  const result = getFinalResult({
    matchResults: [
      { resultOrderID: 1, resultTypeID: 2, pointsTeam1: 1, pointsTeam2: 1 },
      { resultOrderID: 3, resultTypeID: 3, pointsTeam1: 2, pointsTeam2: 1 },
      { resultOrderID: 2, resultTypeID: 2, pointsTeam1: 1, pointsTeam2: 0 },
    ],
  });

  assert.equal(result?.pointsTeam1, 2);
  assert.equal(result?.pointsTeam2, 1);
});

test("deriveGroupStandings builds a table from finished group matches", () => {
  const standings = deriveGroupStandings([
    createMatch({
      matchID: 1,
      groupName: "Group A",
      groupOrderID: 1,
      team1: { teamId: 1, teamName: "Alpha" },
      team2: { teamId: 2, teamName: "Beta" },
      score: [2, 0],
    }),
    createMatch({
      matchID: 2,
      groupName: "Group A",
      groupOrderID: 1,
      team1: { teamId: 3, teamName: "Gamma" },
      team2: { teamId: 4, teamName: "Delta" },
      score: [1, 1],
    }),
  ]);

  assert.equal(standings[0]?.teamName, "Alpha");
  assert.equal(standings[0]?.points, 3);
  assert.equal(standings[0]?.goalDiff, 2);
  assert.equal(standings[1]?.points, 1);
});

test("createWorldCupSnapshot maps grouped tables, matches, and knockout rounds", () => {
  const snapshot = createWorldCupSnapshot({
    league: {
      leagueShortcut: "wc2026",
      leagueName: "FIFA World Cup 2026",
      leagueSeason: 2026,
      sport: { sportName: "Football" },
    },
    groups: [
      { groupID: 1, groupName: "Gruppenphase 1", groupOrderID: 1 },
      { groupID: 2, groupName: "Round of 16", groupOrderID: 2 },
      { groupID: 3, groupName: "Final", groupOrderID: 3 },
    ],
    groupTables: [
      {
        teamGroupId: 101,
        teamGroupName: "Gruppe A",
        teams: [
          { teamInfoId: 1, teamName: "Alpha", points: 3 },
          { teamInfoId: 2, teamName: "Beta", points: 0 },
        ],
      },
      {
        teamGroupId: 102,
        teamGroupName: "Gruppe B",
        teams: [
          { teamInfoId: 3, teamName: "Gamma", points: 1 },
          { teamInfoId: 4, teamName: "Delta", points: 1 },
        ],
      },
    ],
    teams: [
      { teamId: 1, teamName: "Alpha", teamGroupName: "Gruppe A" },
      { teamId: 2, teamName: "Beta", teamGroupName: "Gruppe A" },
      { teamId: 3, teamName: "Gamma", teamGroupName: "Gruppe B" },
      { teamId: 4, teamName: "Delta", teamGroupName: "Gruppe B" },
    ],
    matches: [
      createMatch({
        matchID: 1,
        groupName: "Gruppenphase 1",
        groupOrderID: 1,
        team1: { teamId: 1, teamName: "Alpha" },
        team2: { teamId: 2, teamName: "Beta" },
        score: [2, 0],
      }),
      createMatch({
        matchID: 2,
        groupName: "Gruppenphase 1",
        groupOrderID: 1,
        team1: { teamId: 3, teamName: "Gamma" },
        team2: { teamId: 4, teamName: "Delta" },
        score: [1, 1],
      }),
      {
        matchID: 3,
        group: { groupName: "Round of 16", groupOrderID: 2 },
        matchDateTimeUTC: "2026-07-01T18:00:00Z",
        matchIsFinished: false,
      },
      {
        matchID: 4,
        group: { groupName: "Final", groupOrderID: 3 },
        matchDateTimeUTC: "2026-07-19T18:00:00Z",
        matchIsFinished: false,
      },
    ],
  });

  assert.equal(snapshot.status, "ready");
  assert.deepEqual(
    snapshot.groupSections.map((section) => section.title),
    ["Gruppe A", "Gruppe B"]
  );
  assert.equal(snapshot.groupSections[0]?.tableSource, "api");
  assert.equal(snapshot.groupSections[0]?.table[0]?.teamName, "Alpha");
  assert.deepEqual(
    snapshot.groupSections.map((section) => section.matches.length),
    [1, 1]
  );
  assert.deepEqual(
    snapshot.knockoutRounds.map((round) => round.title),
    ["Achtelfinale", "Finale"]
  );
  assert.equal(snapshot.knockoutRounds[1]?.matches[0]?.matchID, 4);
});

test("getWorldCupSnapshot selects the duplicate league with complete group tables", async () => {
  const probedShortcuts: string[] = [];
  const completeShortcut = "complete-wm";
  const dataSource: WorldCupDataSource = {
    async getAvailableLeaguesBySeason() {
      return [
        {
          leagueId: 100,
          leagueShortcut: "incomplete-wm",
          leagueName: "WM 2026",
          leagueSeason: 2026,
          sport: { sportName: "Fußball" },
        },
        {
          leagueId: 200,
          leagueShortcut: completeShortcut,
          leagueName: "FIFA World Cup 2026",
          leagueSeason: 2026,
          sport: { sportName: "Football" },
        },
      ];
    },
    async getGroups(leagueShortcut) {
      assert.equal(leagueShortcut, completeShortcut);
      return [{ groupID: 1, groupName: "Gruppenphase 1", groupOrderID: 1 }];
    },
    async getAllMatches(leagueShortcut) {
      assert.equal(leagueShortcut, completeShortcut);
      return [];
    },
    async getGroupTable(leagueShortcut) {
      probedShortcuts.push(leagueShortcut);
      if (leagueShortcut !== completeShortcut) return [];

      return [
        {
          teamGroupId: 101,
          teamGroupName: "Gruppe A",
          teams: [
            { teamInfoId: 1, teamName: "Alpha" },
            { teamInfoId: 2, teamName: "Beta" },
          ],
        },
        {
          teamGroupId: 102,
          teamGroupName: "Gruppe B",
          teams: [
            { teamInfoId: 3, teamName: "Gamma" },
            { teamInfoId: 4, teamName: "Delta" },
          ],
        },
      ];
    },
    async getAvailableTeams(leagueShortcut) {
      assert.equal(leagueShortcut, completeShortcut);
      return [];
    },
  };

  const snapshot = await getWorldCupSnapshot({ dataSource, season: 2026 });

  assert.equal(snapshot.leagueShortcut, completeShortcut);
  assert.deepEqual(
    snapshot.groupSections.map((section) => section.title),
    ["Gruppe A", "Gruppe B"]
  );
  assert.deepEqual(probedShortcuts.sort(), [
    completeShortcut,
    "incomplete-wm",
  ]);
});

test("getWorldCupSnapshot returns an empty state when OpenLigaDB has no 2026 World Cup league", async () => {
  const dataSource: WorldCupDataSource = {
    async getAvailableLeaguesBySeason() {
      return [];
    },
    async getGroups() {
      return [];
    },
    async getAllMatches() {
      return [];
    },
    async getGroupTable() {
      return [];
    },
    async getAvailableTeams() {
      return [];
    },
  };

  const snapshot = await getWorldCupSnapshot({ dataSource, season: 2026 });

  assert.equal(snapshot.status, "empty");
  assert.equal(snapshot.groupSections.length, 0);
  assert.match(snapshot.emptyReason ?? "", /noch keine World-Cup-Liga/);
});

test("getWorldCupSnapshot records when fresh World Cup data finished loading", async () => {
  const dataSource: WorldCupDataSource = {
    async getAvailableLeaguesBySeason() {
      return [
        {
          leagueShortcut: "wc2026",
          leagueName: "FIFA World Cup 2026",
          leagueSeason: 2026,
          sport: { sportName: "Football" },
        },
      ];
    },
    async getGroups() {
      return [{ groupID: 1, groupName: "Group A", groupOrderID: 1 }];
    },
    async getAllMatches() {
      return [
        createMatch({
          matchID: 1,
          groupName: "Group A",
          groupOrderID: 1,
          team1: { teamId: 1, teamName: "Alpha" },
          team2: { teamId: 2, teamName: "Beta" },
          score: [1, 0],
        }),
      ];
    },
    async getGroupTable() {
      return [];
    },
    async getAvailableTeams() {
      return [];
    },
  };
  const loadedAt = new Date("2026-06-10T20:45:12.000Z");

  const snapshot = await getWorldCupSnapshot({
    dataSource,
    season: 2026,
    now: () => loadedAt,
  });

  assert.equal(snapshot.status, "ready");
  assert.equal(snapshot.lastUpdated, loadedAt.toISOString());
});
