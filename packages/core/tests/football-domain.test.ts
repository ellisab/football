import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLeagueEntriesByGroup,
  findNextGroup,
  getCurrentSeasonYear,
  normalizeIconUrl,
  resolveLeagueSelection,
  resolveSeasonSelection,
  sortGoals,
} from "../src/index";

test("getCurrentSeasonYear uses July as season cutoff", () => {
  assert.equal(getCurrentSeasonYear(new Date("2026-06-30T12:00:00Z")), 2025);
  assert.equal(getCurrentSeasonYear(new Date("2026-07-01T12:00:00Z")), 2026);
});

test("resolveSeasonSelection prefers requested season when available", () => {
  const entries = [
    { leagueSeason: 2025 },
    { leagueSeason: 2024 },
  ];

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
    [1, 2, 3]
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

test("normalizeIconUrl upgrades allowed http hosts to https", () => {
  const normalized = normalizeIconUrl("http://upload.wikimedia.org/logo.svg");

  assert.equal(normalized, "https://upload.wikimedia.org/logo.svg");
});

test("buildLeagueEntriesByGroup prioritizes shortcut over broad name matches", () => {
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

test("buildLeagueEntriesByGroup maps women Bundesliga shortcuts to dedicated groups", () => {
  const leagues = [
    {
      leagueShortcut: "fbl1",
      leagueName: "1. Frauen-Bundesliga 2025",
      leagueSeason: 2025,
      sport: { sportName: "Fußball" },
    },
    {
      leagueShortcut: "fbl2",
      leagueName: "2. Frauen-Bundesliga 2025",
      leagueSeason: 2025,
      sport: { sportName: "Fußball" },
    },
  ];

  const grouped = buildLeagueEntriesByGroup(leagues);

  assert.equal(grouped.get("fbl1")?.length, 1);
  assert.equal(grouped.get("fbl1")?.[0]?.leagueShortcut, "fbl1");
  assert.equal(grouped.get("fbl2")?.length, 1);
  assert.equal(grouped.get("fbl2")?.[0]?.leagueShortcut, "fbl2");
});

test("buildLeagueEntriesByGroup resolves bl1f/bl2f by most specific shortcut match", () => {
  const leagues = [
    {
      leagueShortcut: "bl1f",
      leagueName: "1. Frauen-Bundesliga",
      leagueSeason: 2023,
      sport: { sportName: "Frauenfußball" },
    },
    {
      leagueShortcut: "bl2f",
      leagueName: "2. Frauen-Bundesliga",
      leagueSeason: 2024,
      sport: { sportName: "Frauenfußball" },
    },
    {
      leagueShortcut: "bl1fan",
      leagueName: "1. Fußball-Fan-Bundesliga 2022/2023",
      leagueSeason: 2022,
      sport: { sportName: "Fußball" },
    },
    {
      leagueShortcut: "bl1/arena",
      leagueName: "1. Fußball-Bundesliga 2018/2019 (Arena)",
      leagueSeason: 2018,
      sport: { sportName: "Fußball" },
    },
  ];

  const grouped = buildLeagueEntriesByGroup(leagues);

  assert.equal(grouped.get("fbl1")?.length, 1);
  assert.equal(grouped.get("fbl1")?.[0]?.leagueShortcut, "bl1f");
  assert.equal(
    grouped.get("fbl1")?.some((entry) => entry.leagueShortcut === "bl1fan"),
    false
  );
  assert.equal(grouped.get("fbl2")?.length, 1);
  assert.equal(grouped.get("fbl2")?.[0]?.leagueShortcut, "bl2f");
  assert.equal(grouped.get("bl1")?.some((entry) => entry.leagueShortcut === "bl1/arena"), true);
  assert.equal(grouped.get("bl2")?.length, 0);
});
