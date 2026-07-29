import assert from "node:assert/strict";
import test from "node:test";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import {
  type CompetitionMatch,
  getMatchScore,
  getMatchStatus,
} from "@/features/football/view-utils";
import { refreshUncertainMatches } from "./refresh-uncertain-matches";

const now = new Date("2026-07-12T12:00:00Z");

const createItem = (match: ApiMatch): CompetitionMatch => ({
  competition: {
    resolvedLeague: "bl1",
  } as CompetitionMatch["competition"],
  match: {
    leagueName: "Bundesliga",
    leagueShortcut: "bl1",
    ...match,
  },
});

test("refreshUncertainMatches refreshes an unknown match during its settlement grace", async () => {
  const staleMatch: ApiMatch = {
    matchID: 84295,
    matchDateTimeUTC: "2026-07-12T06:00:00Z",
    leagueName: "Bundesliga",
    leagueShortcut: "bl1",
    matchIsFinished: false,
    team1: { teamName: "Argentinien" },
    team2: { teamName: "Schweiz" },
  };
  const loadedIds: number[] = [];

  const matches = await refreshUncertainMatches({
    matches: [createItem(staleMatch)],
    now,
    loadMatch: async (matchId) => {
      loadedIds.push(matchId);
      return {
        ...staleMatch,
        matchIsFinished: true,
        matchResults: [
          {
            pointsTeam1: 3,
            pointsTeam2: 1,
            resultOrderID: 5,
            resultTypeID: 2,
          },
        ],
      };
    },
  });

  assert.deepEqual(loadedIds, [84295]);
  assert.equal(getMatchStatus(matches[0]!.match, now), "finished");
  assert.equal(getMatchScore(matches[0]!.match), "3:1");
});

test("refreshUncertainMatches adds a current score to a possibly live match", async () => {
  const staleMatch: ApiMatch = {
    matchID: 84682,
    matchDateTimeUTC: "2026-07-12T11:00:00Z",
    leagueName: "Bundesliga",
    leagueShortcut: "bl1",
    matchIsFinished: false,
    team1: { teamName: "Frankreich" },
    team2: { teamName: "Spanien" },
  };

  const matches = await refreshUncertainMatches({
    matches: [createItem(staleMatch)],
    now,
    loadMatch: async () => ({
      ...staleMatch,
      matchResults: [
        {
          pointsTeam1: 0,
          pointsTeam2: 2,
          resultOrderID: 2,
          resultTypeID: 2,
        },
      ],
    }),
  });

  assert.equal(getMatchStatus(matches[0]!.match, now), "live");
  assert.equal(getMatchScore(matches[0]!.match), "0:2");
});

test("refreshUncertainMatches skips already settled and upcoming matches", async () => {
  const settled = createItem({
    matchID: 1,
    matchDateTimeUTC: "2026-07-12T01:00:00Z",
    matchIsFinished: true,
  });
  const upcoming = createItem({
    matchID: 2,
    matchDateTimeUTC: "2026-07-12T18:00:00Z",
    matchIsFinished: false,
  });
  let calls = 0;

  const matches = await refreshUncertainMatches({
    matches: [settled, upcoming],
    now,
    loadMatch: async () => {
      calls += 1;
      return {};
    },
  });

  assert.equal(calls, 0);
  assert.equal(matches[0]!.match, settled.match);
  assert.equal(matches[1]!.match, upcoming.match);
});

test("refreshUncertainMatches preserves stale data when the direct refresh fails", async () => {
  const staleMatch: ApiMatch = {
    matchID: 84295,
    matchDateTimeUTC: "2026-07-12T07:00:00Z",
    matchIsFinished: false,
  };
  const item = createItem(staleMatch);

  const matches = await refreshUncertainMatches({
    matches: [item],
    now,
    loadMatch: async () => {
      throw new Error("OpenLigaDB unavailable");
    },
  });

  assert.equal(matches[0]!.match, item.match);
});

test("refreshUncertainMatches rejects replacement data from a different competition", async () => {
  const item = createItem({
    matchID: 84295,
    matchDateTimeUTC: "2026-07-12T07:00:00Z",
    matchIsFinished: false,
  });

  const matches = await refreshUncertainMatches({
    matches: [item],
    now,
    loadMatch: async () => ({
      ...item.match,
      leagueName: "UEFA Champions League",
      leagueShortcut: "cl",
      matchIsFinished: true,
    }),
  });

  assert.equal(matches[0]!.match, item.match);
  assert.equal(matches[0]!.match.matchIsFinished, false);
});

test("refreshUncertainMatches stops polling old or undated unknown matches", async () => {
  const tooOld = createItem({
    matchID: 1,
    matchDateTimeUTC: "2026-07-12T05:59:59Z",
    matchIsFinished: false,
  });
  const missingKickoff = createItem({
    matchID: 2,
    matchIsFinished: false,
  });
  const invalidKickoff = createItem({
    matchID: 3,
    matchDateTimeUTC: "not-a-date",
    matchIsFinished: false,
  });
  let calls = 0;

  const matches = await refreshUncertainMatches({
    matches: [tooOld, missingKickoff, invalidKickoff],
    now,
    loadMatch: async () => {
      calls += 1;
      return { matchIsFinished: true };
    },
  });

  assert.equal(calls, 0);
  assert.equal(matches[0]!.match, tooOld.match);
  assert.equal(matches[1]!.match, missingKickoff.match);
  assert.equal(matches[2]!.match, invalidKickoff.match);
});

test("refreshUncertainMatches does not load an untrusted competition shortcut", async () => {
  const item = createItem({
    matchID: 84295,
    matchDateTimeUTC: "2026-07-12T01:00:00Z",
    leagueName: "International Tournament",
    leagueShortcut: "dfb-international",
    matchIsFinished: false,
  });
  let calls = 0;

  const matches = await refreshUncertainMatches({
    matches: [item],
    now,
    loadMatch: async () => {
      calls += 1;
      return { ...item.match, matchIsFinished: true };
    },
  });

  assert.equal(calls, 0);
  assert.equal(matches[0]!.match, item.match);
});

test("refreshUncertainMatches bounds direct refresh volume and concurrency", async () => {
  const matches = Array.from({ length: 10 }, (_, index) =>
    createItem({
      matchID: index + 1,
      matchDateTimeUTC: "2026-07-12T08:00:00Z",
      matchIsFinished: false,
    }),
  );
  let active = 0;
  let maxActive = 0;
  let calls = 0;

  await refreshUncertainMatches({
    matches,
    now,
    loadMatch: async (matchId) => {
      calls += 1;
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active -= 1;
      return { matchID: matchId, matchIsFinished: true };
    },
  });

  assert.equal(calls, 8);
  assert.equal(maxActive, 4);
});
