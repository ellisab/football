import assert from "node:assert/strict";
import test from "node:test";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import type { WebCompetitionViewModel } from "@/features/home/presenter/home-view-model";
import {
  formatMatchDate,
  formatMatchTime,
  getAllCompetitionMatches,
  getMatchScore,
  getMatchScreenReaderLabel,
  getMatchStatus,
  getMatchStatusLabel,
  getTeamId,
  getTodayCompetitionMatches,
} from "./view-utils";

const now = new Date("2026-07-11T18:00:00Z");

test("football view formats the Berlin-local match date and time", () => {
  const match = { matchDateTimeUTC: "2026-07-11T22:30:00Z" };

  assert.equal(formatMatchDate(match), "12.07.2026");
  assert.equal(formatMatchTime(match), "00:30");
});

test("competition collection deduplicates sections and brackets while filtering by Berlin date", () => {
  const matches: ApiMatch[] = [
    {
      matchID: 1,
      matchDateTimeUTC: "2026-07-11T21:30:00Z",
      matchIsFinished: true,
    },
    {
      matchID: 2,
      matchDateTimeUTC: "2026-07-11T22:30:00Z",
      matchIsFinished: true,
    },
    { matchID: 3, matchDateTimeUTC: "invalid", matchIsFinished: true },
  ];
  const competition: WebCompetitionViewModel = {
    resolvedLeague: "bl1",
    resolvedSeason: 2026,
    leagueLabel: "Bundesliga",
    leagueOptions: [],
    availableGroups: [],
    hasTable: false,
    visibleErrors: [],
    bracketMatches: [{ group: {}, matches: [matches[1]] }],
    sections: [
      {
        key: "matchday",
        kicker: "Spieltag",
        title: "Spieltag",
        subtitle: "",
        emptyText: "",
        renderKind: "matches",
        items: matches,
      },
    ],
  };
  const competitions = [
    competition,
    { ...competition, resolvedLeague: "cl" as const },
  ];
  const all = getAllCompetitionMatches(competitions);
  const today = getTodayCompetitionMatches({
    competitions,
    date: new Date("2026-07-12T12:00:00Z"),
  });

  assert.deepEqual(
    all.map(({ match }) => match.matchID),
    [1, 1, 2, 2, 3, 3],
  );
  assert.deepEqual(
    today.map(({ competition: entry, match }) => [
      entry.resolvedLeague,
      match.matchID,
    ]),
    [
      ["bl1", 2],
      ["cl", 2],
    ],
  );
  assert.strictEqual(today[0]?.match, matches[1]);
  assert.deepEqual(
    getTodayCompetitionMatches({ competitions, date: new Date("invalid") }),
    [],
  );
});

test("team identities retain numeric IDs and normalize fallback names", () => {
  assert.equal(getTeamId({ teamId: 0, teamName: "Köln" }), "0");
  assert.equal(getTeamId({ teamInfoId: 12, teamName: "Köln" }), "12");
  assert.equal(getTeamId({ teamName: "1. FC Köln" }), "1-fc-koln");
  assert.equal(getTeamId({}), "team");
  assert.equal(getTeamId(), "team");
});

test("football view status wrappers retain caller-compatible names without hiding uncertainty", () => {
  assert.equal(
    getMatchStatus(
      { matchDateTimeUTC: "2026-07-11T19:00:00Z", matchIsFinished: false },
      now,
    ),
    "upcoming",
  );
  assert.equal(
    getMatchStatus(
      { matchDateTimeUTC: "2026-07-11T17:00:00Z", matchIsFinished: false },
      now,
    ),
    "live",
  );
  assert.equal(
    getMatchStatus(
      { matchDateTimeUTC: "2026-07-11T12:00:00Z", matchIsFinished: false },
      now,
    ),
    "unknown",
  );
  assert.equal(
    getMatchStatusLabel(
      { matchDateTimeUTC: "2026-07-11T12:00:00Z", matchIsFinished: false },
      now,
    ),
    "Status unklar",
  );
});

test("football view score and accessible-label wrappers preserve incomplete results", () => {
  const match = {
    matchIsFinished: false,
    matchResults: [
      {
        pointsTeam1: 2,
        resultOrderID: 2,
        resultTypeID: 2,
      },
    ],
    team1: { teamName: "Team Eins" },
    team2: { teamName: "Team Zwei" },
  };

  assert.equal(getMatchScore(match), "2:-");
  assert.equal(
    getMatchScreenReaderLabel(match, now),
    "Team Eins gegen Team Zwei, Status unklar.",
  );
});
