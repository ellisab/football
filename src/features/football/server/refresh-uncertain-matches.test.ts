import assert from "node:assert/strict";
import test from "node:test";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import {
  getMatchScore,
  getMatchStatus,
  type CompetitionMatch,
} from "@/features/football/view-utils";
import { refreshUncertainMatches } from "./refresh-uncertain-matches";

const now = new Date("2026-07-12T12:00:00Z");

const createItem = (match: ApiMatch): CompetitionMatch => ({
  competition: {} as CompetitionMatch["competition"],
  match,
});

test("refreshUncertainMatches replaces a stale unknown match with its fresh result", async () => {
  const staleMatch: ApiMatch = {
    matchID: 84295,
    matchDateTimeUTC: "2026-07-12T01:00:00Z",
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
    matchDateTimeUTC: "2026-07-12T01:00:00Z",
    matchIsFinished: false,
  };

  const matches = await refreshUncertainMatches({
    matches: [createItem(staleMatch)],
    now,
    loadMatch: async () => {
      throw new Error("OpenLigaDB unavailable");
    },
  });

  assert.equal(matches[0]!.match, staleMatch);
});

test("refreshUncertainMatches bounds direct refresh volume and concurrency", async () => {
  const matches = Array.from({ length: 10 }, (_, index) =>
    createItem({
      matchID: index + 1,
      matchDateTimeUTC: "2026-07-12T01:00:00Z",
      matchIsFinished: false,
    })
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
