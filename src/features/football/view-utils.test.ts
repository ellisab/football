import assert from "node:assert/strict";
import test from "node:test";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import type { WebCompetitionViewModel } from "@/features/home/presenter/home-view-model";
import {
  collectTeams,
  findMatchById,
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

const competitionWithMatches = (
  matches: ApiMatch[],
  overrides: Partial<WebCompetitionViewModel> = {},
): WebCompetitionViewModel => ({
  resolvedLeague: "bl1",
  resolvedSeason: 2026,
  leagueLabel: "Bundesliga",
  leagueOptions: [],
  availableGroups: [],
  hasTable: false,
  visibleErrors: [],
  bracketMatches: [],
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
  ...overrides,
});

test("match ordering retains status priority, kickoff order, and unknown dates last within a status", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now });
  const competition = competitionWithMatches([
    { matchID: 5, matchDateTimeUTC: "invalid", matchIsFinished: true },
    { matchID: 2, matchDateTimeUTC: "2026-07-11T19:00:00Z" },
    { matchID: 3, matchDateTimeUTC: "2026-07-11T12:00:00Z" },
    { matchID: 1, matchDateTimeUTC: "2026-07-11T17:00:00Z" },
    {
      matchID: 4,
      matchDateTimeUTC: "2026-07-11T08:00:00Z",
      matchIsFinished: true,
    },
    { matchID: 6 },
  ]);
  assert.deepEqual(
    getAllCompetitionMatches([competition]).map(({ match }) => match.matchID),
    [1, 2, 3, 6, 4, 5],
  );
  assert.deepEqual(
    competition.sections[0]?.items.map((match) => (match as ApiMatch).matchID),
    [5, 2, 3, 1, 4, 6],
  );
});

test("match lookup preserves first-occurrence identity collisions before matching IDs", () => {
  const first: ApiMatch = { team1: { teamId: 7 }, team2: { teamId: 9 } };
  const collision: ApiMatch = { matchID: 7, team1: { teamId: 9 } };
  const distinct: ApiMatch = { matchID: 7, matchDateTimeUTC: "invalid" };
  assert.equal(
    findMatchById([competitionWithMatches([first, collision])], "7"),
    undefined,
  );
  assert.strictEqual(
    findMatchById([competitionWithMatches([first, collision, distinct])], "7")
      ?.match,
    distinct,
  );
});

test("match lookup keeps display precedence for duplicate IDs across competitions", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now });
  const finished: ApiMatch = { matchID: 7, matchIsFinished: true };
  const upcoming: ApiMatch = {
    matchID: 7,
    matchDateTimeUTC: "2026-07-11T19:00:00Z",
  };
  const competitions = [
    competitionWithMatches([finished]),
    competitionWithMatches([upcoming], {
      resolvedLeague: "cl",
      leagueLabel: "Champions League",
    }),
  ];
  assert.strictEqual(findMatchById(competitions, "7")?.match, upcoming);
  assert.equal(findMatchById(competitions, "missing"), undefined);
});

test("team collection retains table metadata, cross-competition deduplication, and equal-time next-match selection", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now });
  const team1 = { teamId: 0, teamName: "Match name", teamIconUrl: "logo" };
  const team2 = { teamId: 7, teamName: "Opponent" };
  const matches: ApiMatch[] = [
    { matchID: 1, team1, team2, matchDateTimeUTC: "2026-07-11T19:00:00Z" },
    { matchID: 2, team1, team2, matchDateTimeUTC: "2026-07-11T19:00:00Z" },
    {
      matchID: 3,
      team1,
      team2,
      matchDateTimeUTC: "2026-07-10T18:00:00Z",
      matchIsFinished: true,
    },
    {
      matchID: 4,
      team1,
      team2,
      matchDateTimeUTC: "invalid",
      matchIsFinished: true,
    },
  ];
  const competition = competitionWithMatches(matches);
  competition.sections.push({
    key: "table",
    renderKind: "table",
    kicker: "Tabelle",
    title: "Tabelle",
    subtitle: "",
    emptyText: "",
    items: [{ teamInfoId: 0, teamName: "Table name", points: 42 }],
  });
  const other = competitionWithMatches(matches, {
    resolvedLeague: "cl",
    leagueLabel: "Champions League",
  });
  const competitions = [competition, other];
  const collected = getAllCompetitionMatches(competitions);
  const teams = collectTeams(competitions, collected);
  assert.deepEqual(teams, collectTeams(competitions));
  const team = teams[0]!;
  assert.equal(team.id, "0");
  assert.equal(team.name, "Table name");
  assert.equal(team.iconUrl, "logo");
  assert.deepEqual(team.tablePosition, { points: 42, position: 1 });
  assert.deepEqual(
    team.competitions.map(({ league }) => league),
    ["bl1", "cl"],
  );
  assert.deepEqual(
    team.recentMatches.map(({ match }) => match.matchID),
    [4, 3],
  );
  assert.deepEqual(
    team.upcomingMatches.map(({ match }) => match.matchID),
    [1, 2],
  );
  assert.strictEqual(team.nextMatch?.match, matches[1]);
  assert.strictEqual(team.nextMatch?.competition, other);
  assert.equal(teams[1]?.recentMatches.length, 2);
});

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
