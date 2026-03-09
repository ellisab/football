import assert from "node:assert/strict";
import test from "node:test";
import type { HomeState } from "@footballleagues/core/home";
import { createWebHomeViewModel } from "./home-view-model";

const sampleState: HomeState = {
  resolvedLeague: "bl1",
  resolvedSeason: 2025,
  leagueOptions: [{ shortcut: "bl1", label: "Bundesliga 2025/2026", seasons: [2025] }],
  currentRound: {
    groupName: "11. Spieltag",
    groupOrderID: 11,
    matches: [
      {
        matchID: 11,
        matchDateTimeUTC: "2026-03-01T20:00:00Z",
        team1: { teamId: 1, teamName: "Team A" },
        team2: { teamId: 2, teamName: "Team B" },
        matchIsFinished: true,
        matchResults: [{ resultTypeID: 2, pointsTeam1: 2, pointsTeam2: 1 }],
      },
    ],
  },
  nextRound: {
    groupName: "12. Spieltag",
    groupOrderID: 12,
    matches: [
      {
        matchID: 12,
        matchDateTimeUTC: "2026-03-08T20:00:00Z",
        team1: { teamId: 3, teamName: "Team C" },
        team2: { teamId: 4, teamName: "Team D" },
        matchIsFinished: false,
        matchResults: [],
      },
    ],
  },
  hasTable: true,
  bracketMatches: [],
  table: [{ teamInfoId: 1, teamName: "Team A", points: 24 }],
  errorKeys: ["table", "next matchday"],
  usesKnockoutLabels: false,
  isChampionsLeaguePlayoffRound: false,
  sections: [
    {
      key: "next-round",
      round: {
        groupName: "12. Spieltag",
        groupOrderID: 12,
        matches: [
          {
            matchID: 12,
            matchDateTimeUTC: "2026-03-08T20:00:00Z",
            team1: { teamId: 3, teamName: "Team C" },
            team2: { teamId: 4, teamName: "Team D" },
            matchIsFinished: false,
            matchResults: [],
          },
        ],
      },
      renderKind: "matches",
      items: [
        {
          matchID: 12,
          matchDateTimeUTC: "2026-03-08T20:00:00Z",
          team1: { teamId: 3, teamName: "Team C" },
          team2: { teamId: 4, teamName: "Team D" },
          matchIsFinished: false,
          matchResults: [],
        },
      ],
    },
    {
      key: "matchday",
      round: {
        groupName: "11. Spieltag",
        groupOrderID: 11,
        matches: [
          {
            matchID: 11,
            matchDateTimeUTC: "2026-03-01T20:00:00Z",
            team1: { teamId: 1, teamName: "Team A" },
            team2: { teamId: 2, teamName: "Team B" },
            matchIsFinished: true,
            matchResults: [{ resultTypeID: 2, pointsTeam1: 2, pointsTeam2: 1 }],
          },
        ],
      },
      renderKind: "matches",
      items: [
        {
          matchID: 11,
          matchDateTimeUTC: "2026-03-01T20:00:00Z",
          team1: { teamId: 1, teamName: "Team A" },
          team2: { teamId: 2, teamName: "Team B" },
          matchIsFinished: true,
          matchResults: [{ resultTypeID: 2, pointsTeam1: 2, pointsTeam2: 1 }],
        },
      ],
    },
    {
      key: "table",
      renderKind: "table",
      items: [{ teamInfoId: 1, teamName: "Team A", points: 24 }],
    },
  ],
};

test("createWebHomeViewModel adds web copy to semantic home state", () => {
  const viewModel = createWebHomeViewModel(sampleState);

  assert.equal(viewModel.leagueLabel, "Bundesliga");
  assert.deepEqual(
    viewModel.sections.map((section) => section.key),
    ["next-round", "matchday", "table"]
  );
  assert.equal(viewModel.sections[0]?.subtitle, "Bundesliga · Season 2025");
  assert.equal(viewModel.sections[2]?.subtitle, "Updated standings for the selected season.");
  assert.equal(viewModel.visibleErrors.join(", "), "table, next round matches");
});
