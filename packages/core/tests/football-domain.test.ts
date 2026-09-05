import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLeagueEntriesByGroup,
  findNextGroup,
  getBerlinDateKey,
  getCurrentSeasonYear,
  getKnockoutLeg,
  getKnockoutStageName,
  getLeagueLabel,
  getMatchBerlinDateKey,
  groupKnockoutMatchesByTie,
  hasLeagueTable,
  isPlayoffRoundName,
  localizeGroupName,
  normalizeIconUrl,
  resolveLeagueKey,
  resolveLeagueSelection,
  resolveSeasonSelection,
  sortGoals,
} from "../src/index";

test("getCurrentSeasonYear uses July as season cutoff", () => {
  assert.equal(getCurrentSeasonYear(new Date("2026-06-30T12:00:00Z")), 2025);
  assert.equal(getCurrentSeasonYear(new Date("2026-07-01T12:00:00Z")), 2026);
});

test("resolveSeasonSelection prefers requested season when available", () => {
  const entries = [{ leagueSeason: 2025 }, { leagueSeason: 2024 }];

  const resolved = resolveSeasonSelection({
    requestedSeason: "2024",
    entries,
    fallbackYear: 2026,
  });

  assert.equal(resolved, 2024);
});

test("resolveSeasonSelection falls back to latest available season", () => {
  const entries = [
    { leagueSeason: 2023 },
    { leagueSeason: 2025 },
    { leagueSeason: 2024 },
  ];

  const resolved = resolveSeasonSelection({
    requestedSeason: "1999",
    entries,
    fallbackYear: 2026,
  });

  assert.equal(resolved, 2025);
});

test("resolveLeagueSelection falls back for unsupported leagues", () => {
  const available = ["bl1", "cl"] as const;

  assert.equal(resolveLeagueSelection("bl1", [...available]), "bl1");
  assert.equal(resolveLeagueSelection("pl", [...available]), "bl1");
});

test("resolveLeagueSelection defaults to Bundesliga when it is available", () => {
  const available = ["bl1", "cl"] as const;

  assert.equal(resolveLeagueSelection(undefined, [...available]), "bl1");
  assert.equal(resolveLeagueSelection("pl", [...available]), "bl1");
});

test("resolveLeagueKey accepts only explicitly configured shortcuts", () => {
  assert.equal(
    resolveLeagueKey({
      leagueShortcut: "dfb-international",
      leagueName: "DFB-Pokal International",
    }),
    undefined,
  );
  assert.equal(
    resolveLeagueKey({
      leagueShortcut: "ucl-extra",
      leagueName: "Champions League Extra",
    }),
    undefined,
  );
  assert.equal(
    resolveLeagueKey({ leagueShortcut: "dfb", leagueName: "DFB-Pokal" }),
    "dfb",
  );
});

test("league labels and table support come from the canonical config", () => {
  assert.equal(getLeagueLabel("bl1"), "Bundesliga");
  assert.equal(getLeagueLabel("dfb"), "DFB-Pokal");
  assert.equal(hasLeagueTable("bl2"), true);
  assert.equal(hasLeagueTable("dfb"), false);
});

test("sortGoals returns goals in chronological order", () => {
  const match = {
    goals: [
      { goalID: 2, matchMinute: 67 },
      { goalID: 1, matchMinute: 12 },
      { goalID: 3, matchMinute: 89 },
    ],
  };

  const sorted = sortGoals(match);

  assert.deepEqual(
    sorted.goals?.map((goal) => goal.goalID),
    [1, 2, 3],
  );
});

test("findNextGroup returns the next higher group order", () => {
  const groups = [
    { groupOrderID: 1, groupName: "Matchday 1" },
    { groupOrderID: 3, groupName: "Matchday 3" },
    { groupOrderID: 2, groupName: "Matchday 2" },
  ];

  const next = findNextGroup(groups, 1);

  assert.equal(next?.groupOrderID, 2);
  assert.equal(next?.groupName, "Matchday 2");
});

test("Berlin date keys use the local matchday", () => {
  assert.equal(getBerlinDateKey("2026-06-14T22:30:00Z"), "2026-06-15");
  assert.equal(
    getMatchBerlinDateKey({
      matchDateTimeUTC: "2026-12-31T23:30:00Z",
    }),
    "2027-01-01",
  );
});

test("stage helpers normalize matchday and playoff labels", () => {
  assert.equal(localizeGroupName("14. Spieltag"), "14. Spieltag");
  assert.equal(localizeGroupName("Quarter-finals"), "Viertelfinale");
  assert.equal(isPlayoffRoundName("Champions League Playoffs"), true);
  assert.equal(isPlayoffRoundName("Semi-finals"), false);
  assert.equal(getKnockoutStageName("Achtelfinale Hinspiele"), "Achtelfinale");
  assert.equal(
    getKnockoutStageName("Quarter-finals second legs"),
    "Quarter-finals",
  );
  assert.equal(getKnockoutLeg("Achtelfinale Hinspiele"), "first");
  assert.equal(getKnockoutLeg("Achtelfinale Rückspiele"), "second");
  assert.equal(getKnockoutLeg("Playoffs"), null);
});

test("normalizeIconUrl upgrades allowed http hosts to https", () => {
  const normalized = normalizeIconUrl("http://upload.wikimedia.org/logo.svg");

  assert.equal(normalized, "https://upload.wikimedia.org/logo.svg");
});

test("buildLeagueEntriesByGroup uses exact shortcut identities", () => {
  const leagues = [
    {
      leagueShortcut: "bl2",
      leagueName: "2. Fußball-Bundesliga 2025/2026",
      leagueSeason: 2025,
      sport: { sportName: "Fußball" },
    },
    {
      leagueShortcut: "bl1",
      leagueName: "Fußball-Bundesliga 2025/2026",
      leagueSeason: 2025,
      sport: { sportName: "Fußball" },
    },
  ];

  const grouped = buildLeagueEntriesByGroup(leagues);

  assert.equal(grouped.get("bl2")?.length, 1);
  assert.equal(grouped.get("bl2")?.[0]?.leagueShortcut, "bl2");
  assert.equal(grouped.get("bl1")?.length, 1);
  assert.equal(grouped.get("bl1")?.[0]?.leagueShortcut, "bl1");
});

test("buildLeagueEntriesByGroup accepts configured aliases and ignores lookalikes", () => {
  const grouped = buildLeagueEntriesByGroup([
    {
      leagueShortcut: "bl1-amateur",
      leagueName: "Amateur-Bundesliga",
      leagueSeason: 2026,
      sport: { sportName: "Fußball" },
    },
    {
      leagueShortcut: "bl1/arena",
      leagueName: "1. Fußball-Bundesliga 2018/2019 (Arena)",
      leagueSeason: 2018,
      sport: { sportName: "Fußball" },
    },
  ]);

  assert.deepEqual([...grouped.keys()], ["bl1", "bl2", "dfb", "cl"]);
  assert.deepEqual(
    grouped.get("bl1")?.map((entry) => entry.leagueShortcut),
    ["bl1/arena"],
  );
  assert.equal(grouped.get("bl2")?.length, 0);
});

test("groupKnockoutMatchesByTie groups home and away legs into one tie", () => {
  const ties = groupKnockoutMatchesByTie([
    {
      matchID: 1,
      matchDateTimeUTC: "2026-03-01T20:00:00Z",
      team1: { teamId: 1, teamName: "Team A" },
      team2: { teamId: 2, teamName: "Team B" },
      matchResults: [{ resultTypeID: 2, pointsTeam1: 2, pointsTeam2: 1 }],
    },
    {
      matchID: 2,
      matchDateTimeUTC: "2026-03-08T20:00:00Z",
      team1: { teamId: 2, teamName: "Team B" },
      team2: { teamId: 1, teamName: "Team A" },
      matchResults: [{ resultTypeID: 2, pointsTeam1: 1, pointsTeam2: 0 }],
    },
  ]);

  assert.equal(ties.length, 1);
  assert.equal(ties[0]?.matches.length, 2);
  assert.equal(ties[0]?.team1.teamName, "Team A");
  assert.equal(ties[0]?.team2.teamName, "Team B");
  assert.deepEqual(ties[0]?.aggregateScore, {
    team1: 2,
    team2: 2,
    countedLegs: 2,
    totalLegs: 2,
    leader: null,
  });
});

test("groupKnockoutMatchesByTie keeps single-leg rounds as single ties", () => {
  const ties = groupKnockoutMatchesByTie([
    {
      matchID: 10,
      matchDateTimeUTC: "2026-05-30T20:00:00Z",
      team1: { teamId: 11, teamName: "Team C" },
      team2: { teamId: 22, teamName: "Team D" },
      matchIsFinished: false,
    },
  ]);

  assert.equal(ties.length, 1);
  assert.equal(ties[0]?.matches.length, 1);
  assert.equal(ties[0]?.aggregateScore, undefined);
});
