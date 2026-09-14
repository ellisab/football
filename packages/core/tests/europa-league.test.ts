import assert from "node:assert/strict";
import test from "node:test";
import {
  type FootballDataSource,
  getHomeLeagueMetadata,
  getMatchdaySnapshot,
  getTableSnapshot,
} from "../src/home";
import { resolveLeagueKey } from "../src/leagues";

test("Europa League discovery, games and table use the season-specific feed", async () => {
  const calls: string[] = [];
  const dataSource: FootballDataSource = {
    getAvailableLeagues: async () => [
      {
        leagueShortcut: "uel2026",
        leagueName: "Europa League 2026/27",
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
      return [{ teamInfoId: 441, teamName: "AC Mailand", points: 0 }];
    },
  };
  const metadata = await getHomeLeagueMetadata({ dataSource });
  assert.deepEqual(metadata.availableGroupKeys, ["uel"]);
  assert.deepEqual(metadata.leagueOptions[0]?.seasons, [2026]);
  const games = await getMatchdaySnapshot(
    { league: "uel", season: "2026", group: 1 },
    { dataSource },
  );
  const table = await getTableSnapshot(
    { league: "uel", season: "2026" },
    { dataSource },
  );
  assert.equal(games.matches[0]?.matchID, 87761);
  assert.equal(table.table[0]?.teamName, "AC Mailand");
  assert.deepEqual(calls, ["games:uel2026:2026:1", "table:uel2026:2026"]);
  assert.equal(
    resolveLeagueKey({
      leagueShortcut: "uecl",
      leagueName: "Europa Conference League",
    }),
    undefined,
  );
  assert.equal(
    resolveLeagueKey({
      leagueShortcut: "uel",
      leagueName: "Europa League (K.-o.-Phase)",
    }),
    undefined,
  );
});
