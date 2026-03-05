import assert from "node:assert/strict";
import test from "node:test";
import type { HomeState } from "@footballleagues/core/home";
import type { KnockoutTie } from "@footballleagues/core/matches";
import { createMobileHomeViewModel } from "./home-view-model";

const playoffMatch = {
  matchID: 201,
  matchDateTimeUTC: "2026-03-01T20:00:00Z",
  team1: { teamId: 1, teamName: "Club A" },
  team2: { teamId: 2, teamName: "Club B" },
  matchIsFinished: true,
  matchResults: [{ resultTypeID: 2, pointsTeam1: 2, pointsTeam2: 1 }],
};

const playoffTie: KnockoutTie = {
  key: "id:1__id:2",
  team1: { teamId: 1, teamName: "Club A" },
  team2: { teamId: 2, teamName: "Club B" },
  matches: [playoffMatch],
  aggregateScore: {
    team1: 2,
    team2: 1,
    countedLegs: 1,
    totalLegs: 1,
    leader: "team1",
  },
};

const sampleState: HomeState = {
  resolvedLeague: "cl",
  resolvedSeason: 2025,
  leagueOptions: [{ shortcut: "cl", label: "Champions League 2025/2026", seasons: [2025] }],
  currentRound: {
    groupName: "Playoffs",
    groupOrderID: 9,
    matches: [playoffMatch],
  },
  nextRound: {
    groupName: "Round of 16",
    groupOrderID: 10,
    matches: [
      {
        matchID: 203,
        matchDateTimeUTC: "2026-03-08T20:00:00Z",
        team1: { teamId: 3, teamName: "Club C" },
        team2: { teamId: 4, teamName: "Club D" },
        matchIsFinished: false,
        matchResults: [],
      },
    ],
  },
  hasTable: true,
  bracketMatches: [
    {
      group: { groupID: 9, groupName: "Playoffs", groupOrderID: 9 },
      matches: [playoffMatch],
    },
  ],
  table: [{ teamInfoId: 7, teamName: "Club A", points: 9 }],
  errorKeys: ["table", "next matchday"],
  usesKnockoutLabels: true,
  isChampionsLeaguePlayoffRound: true,
  featuredMatch: playoffMatch,
  sections: [
    {
      key: "next-round",
      round: {
        groupName: "Round of 16",
        groupOrderID: 10,
        matches: [
          {
            matchID: 203,
            matchDateTimeUTC: "2026-03-08T20:00:00Z",
            team1: { teamId: 3, teamName: "Club C" },
            team2: { teamId: 4, teamName: "Club D" },
            matchIsFinished: false,
            matchResults: [],
          },
        ],
      },
      renderKind: "ties",
      items: [playoffTie],
    },
    {
      key: "table",
      renderKind: "table",
      items: [{ teamInfoId: 7, teamName: "Club A", points: 9 }],
    },
  ] as HomeState["sections"],
};

test("createMobileHomeViewModel adds mobile copy to semantic home state", () => {
  const viewModel = createMobileHomeViewModel(sampleState);

  assert.equal(viewModel.leagueLabel, "Champions League");
  assert.equal(viewModel.sections[0]?.key, "next-round");
  assert.equal(viewModel.sections[0]?.renderKind, "ties");
  assert.equal(viewModel.sections[0]?.subtitle, "Season 2025 · upcoming fixtures");
  assert.deepEqual(
    viewModel.sections.map((section) => section.key),
    ["next-round", "table"]
  );
  assert.equal(viewModel.visibleErrors.join(", "), "table, next round matches");
});
