import assert from "node:assert/strict";
import test from "node:test";
import {
  type FootballDataSource,
  getHomeLeagueMetadata,
  getMatchdaySnapshot,
  getTableSnapshot,
} from "../src/home";
import { resolveLeagueKey } from "../src/leagues";

test("Nations League discovery, games and table use only League A", async () => {
  const calls: string[] = [];
  const dataSource: FootballDataSource = {
    getAvailableLeagues: async () => [
      {
        leagueShortcut: "nla",
        leagueName: "Nations League A 2026",
        leagueSeason: 2026,
        sport: { sportName: "Fußball" },
      },
    ],
    getCurrentGroup: async () => ({ groupOrderID: 1 }),
    getGroups: async () => [{ groupOrderID: 1, groupName: "1. Spieltag" }],
    getMatchdayResults: async (shortcut, season, group) => {
      calls.push(`games:${shortcut}:${season}:${group}`);
      return [{ matchID: 87761, matchIsFinished: false }];
    },
    getMatchesByGroup: async () => [],
    getTable: async (shortcut, season) => {
      calls.push(`table:${shortcut}:${season}`);
      return [{ teamInfoId: 441, teamName: "Deutschland", points: 0 }];
    },
  };
  const metadata = await getHomeLeagueMetadata({ dataSource });
  assert.deepEqual(metadata.availableGroupKeys, ["nla"]);
  assert.deepEqual(metadata.leagueOptions[0]?.seasons, [2026]);
  const games = await getMatchdaySnapshot(
    { league: "nla", season: "2026", group: 1 },
    { dataSource },
  );
  const table = await getTableSnapshot(
    { league: "nla", season: "2026" },
    { dataSource },
  );
  assert.equal(games.matches[0]?.matchID, 87761);
  assert.equal(table.table[0]?.teamName, "Deutschland");
  assert.deepEqual(calls, ["games:nla:2026:1", "table:nla:2026"]);
  for (const shortcut of ["unl", "unl2024", "uefanl", "nlb", "nlc", "nld"]) {
    assert.equal(
      resolveLeagueKey({
        leagueShortcut: shortcut,
        leagueName: "Nations League",
      }),
      undefined,
    );
  }
});
