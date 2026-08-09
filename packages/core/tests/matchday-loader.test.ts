import assert from "node:assert/strict";
import test from "node:test";
import type { FootballDataSource } from "../src/home";
import { loadMatchdayResults } from "../src/home/domain/matchday-loader";

test("loadMatchdayResults always reads the requested matchday", async () => {
  const calls: Array<[string, number, number]> = [];
  const dataSource = {
    getMatchdayResults: async (
      leagueShortcut: string,
      season: number,
      groupOrderId: number,
    ) => {
      calls.push([leagueShortcut, season, groupOrderId]);
      return [{ matchID: calls.length }];
    },
  } as FootballDataSource;

  const params = {
    dataSource,
    groupOrderId: 10,
    leagueShortcut: "bl1",
    season: 2026,
  };
  const first = await loadMatchdayResults(params);
  const second = await loadMatchdayResults(params);

  assert.deepEqual(calls, [
    ["bl1", 2026, 10],
    ["bl1", 2026, 10],
  ]);
  assert.equal(first.matches[0]?.matchID, 1);
  assert.equal(second.matches[0]?.matchID, 2);
});
