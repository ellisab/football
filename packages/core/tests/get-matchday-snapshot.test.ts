import assert from "node:assert/strict";
import test from "node:test";
import {
  type FootballDataSource,
  getMatchdaySnapshot,
  type HomeRequestOptions,
} from "../src/home";

test("getMatchdaySnapshot passes request options to metadata and matchday data", async () => {
  const metadataOptions: HomeRequestOptions = {
    next: { revalidate: 30 },
  };
  const validationOptions: HomeRequestOptions = {
    cache: "no-store",
  };
  let availableLeagueOptions: HomeRequestOptions | undefined;
  let groupOptions: HomeRequestOptions | undefined;
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
  assert.equal(matchdayOptions, validationOptions);
  assert.equal(matchdayOptions?.cache, "no-store");
  assert.equal(matchdayOptions?.next, undefined);
});
