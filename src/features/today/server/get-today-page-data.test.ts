import assert from "node:assert/strict";
import test from "node:test";
import { getTodayPageData } from "./get-today-page-data";

const leagues = [
  {
    leagueShortcut: "nla",
    leagueSeason: 2026,
    sport: { sportName: "Fußball" },
  },
];
test("date schedule includes all Nations League groups and Germany–Serbia beyond the current round", async () => {
  const fixtures = Array.from({ length: 8 }, (_, i) => ({
    matchID: i === 3 ? 85228 : i + 1,
    group: { groupOrderID: (i % 4) + 1 },
    matchDateTimeUTC: "2026-10-01T18:45:00Z",
    matchIsFinished: i === 0,
    team1: { teamName: i === 3 ? "Deutschland" : "Home" },
    team2: { teamName: i === 3 ? "Serbien" : "Away" },
  }));
  const result = await getTodayPageData("2026-10-01", {
    getAvailableLeagues: async () => leagues,
    getAllMatches: async (shortcut, season) => {
      assert.equal(season, 2026);
      return shortcut === "nla"
        ? [
            ...fixtures,
            { matchID: 90, matchDateTimeUTC: "2026-10-02T18:45:00Z" },
          ]
        : [];
    },
  });
  assert.equal(result.matches.length, 8);
  assert.ok(result.matches.some(({ match }) => match.matchID === 85228));
  assert.ok(result.matches.some(({ match }) => match.matchIsFinished));
  assert.equal(
    new Set(result.matches.map(({ match }) => match.group?.groupOrderID)).size,
    4,
  );
});

test("schedule uses Berlin calendar dates and the season for the selected date", async () => {
  const result = await getTodayPageData("2027-01-02", {
    getAvailableLeagues: async () => leagues,
    getAllMatches: async (shortcut, season) => {
      assert.equal(season, 2026);
      return shortcut === "nla"
        ? [
            { matchID: 1, matchDateTimeUTC: "2027-01-01T23:30:00Z" },
            { matchID: 2, matchDateTimeUTC: "2027-01-02T23:30:00Z" },
          ]
        : [];
    },
  });
  assert.deepEqual(
    result.matches.map(({ match }) => match.matchID),
    [1],
  );
});

test("Nations League uses its edition in the second year", async () => {
  await getTodayPageData("2027-09-01", {
    getAvailableLeagues: async () => leagues,
    getAllMatches: async (shortcut, season) => {
      assert.equal(season, shortcut === "nla" ? 2026 : 2027);
      return [];
    },
  });
});

test("a failed feed preserves healthy matches and marks the schedule incomplete", async () => {
  const result = await getTodayPageData("2026-10-01", {
    getAvailableLeagues: async () => {
      throw new Error("discovery down");
    },
    getAllMatches: async (shortcut) => {
      if (shortcut !== "nla") throw new Error("feed down");
      return [{ matchID: 85228, matchDateTimeUTC: "2026-10-01T18:45:00Z" }];
    },
  });
  assert.equal(result.matches[0]?.match.matchID, 85228);
  assert.match(result.data.visibleErrors[0], /unvollständig/);
});
