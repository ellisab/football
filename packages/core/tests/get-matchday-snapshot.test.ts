import assert from "node:assert/strict";
import test from "node:test";
import {
  type FootballDataSource,
  getMatchdaySnapshot,
  type HomeRequestOptions,
} from "../src/home";
import { clearMatchdayCache } from "../src/home/domain/matchday-loader";

test("getMatchdaySnapshot separates cached metadata from blocking validation", async () => {
  clearMatchdayCache();

  const metadataOptions: HomeRequestOptions = {
    next: { revalidate: 30 },
  };
  const validationOptions: HomeRequestOptions = {
    cache: "no-store",
  };
  let availableLeagueOptions: HomeRequestOptions | undefined;
  let groupOptions: HomeRequestOptions | undefined;
  let lastChangeOptions: HomeRequestOptions | undefined;
  let matchdayOptions: HomeRequestOptions | undefined;

  const dataSource: FootballDataSource = {
    getAvailableLeagues: async (options) => {
      availableLeagueOptions = options;
      return [
        {
          leagueName: "Bundesliga",
          leagueSeason: 2025,
          leagueShortcut: "bl1",
          sport: { sportName: "Fußball" },
        },
      ];
    },
    getCurrentGroup: async () => ({}),
    getGroups: async (_leagueShortcut, _season, options) => {
      groupOptions = options;
      return [
        {
          groupID: 10,
          groupName: "10. Spieltag",
          groupOrderID: 10,
        },
      ];
    },
    getLastChangeDate: async (
      _leagueShortcut,
      _season,
      _groupOrderId,
      options,
    ) => {
      lastChangeOptions = options;
      return "2026-07-22T18:00:00Z";
    },
    getMatchdayResults: async (
      _leagueShortcut,
      _season,
      _groupOrderId,
      options,
    ) => {
      matchdayOptions = options;
      return [{ matchID: 100, matchIsFinished: false }];
    },
    getMatchesByGroup: async () => [],
    getTable: async () => [],
  };

  const result = await getMatchdaySnapshot(
    { group: 10, league: "bl1", season: "2025" },
    {
      dataSource,
      requestOptions: metadataOptions,
      validationRequestOptions: validationOptions,
    },
  );

  assert.equal(result.matches[0]?.matchID, 100);
  assert.equal(availableLeagueOptions, metadataOptions);
  assert.equal(groupOptions, metadataOptions);
  assert.equal(lastChangeOptions, validationOptions);
  assert.equal(matchdayOptions, validationOptions);
  assert.equal(lastChangeOptions?.cache, "no-store");
  assert.equal(lastChangeOptions?.next, undefined);
});
