import assert from "node:assert/strict";
import test from "node:test";
import {
  groupKnockoutMatchesByTie,
  sortMatchesByKickoff,
} from "../src/matches";
import { dedupeMatches } from "../src/matches/dedupe-matches";
import type { ApiMatch } from "../src/openligadb";

test("match lists and knockout ties share kickoff ordering, including unknown dates", () => {
  const matches: ApiMatch[] = [
    { matchID: 2, matchDateTimeUTC: "invalid" },
    { matchID: 12, matchDateTimeUTC: "2026-03-08T20:00:00Z" },
    { matchID: 1 },
    { matchID: 10, matchDateTime: "2026-03-08T20:00:00Z" },
    { matchID: 3, matchDateTimeUTC: "2026-03-01T20:00:00Z" },
  ].map((match) => ({
    ...match,
    team1: { teamId: 1 },
    team2: { teamId: 2 },
  }));
  const originalOrder = matches.map((match) => match.matchID);
  const sorted = sortMatchesByKickoff(matches);
  const ties = groupKnockoutMatchesByTie(matches);

  assert.deepEqual(
    sorted.map((match) => match.matchID),
    [3, 10, 12, 1, 2],
  );
  assert.equal(ties.length, 1);
  assert.deepEqual(ties[0]?.matches, sorted);
  assert.deepEqual(
    matches.map((match) => match.matchID),
    originalOrder,
  );
});

test("round deduplication keeps the first match and distinguishes fallback kickoff keys", () => {
  const identified = { matchID: 0, matchIsFinished: false };
  const fallback = {
    team1: { teamId: 1 },
    team2: { teamId: 2 },
    matchDateTimeUTC: "2026-03-01T20:00:00Z",
  };
  const later = { ...fallback, matchDateTimeUTC: "2026-03-08T20:00:00Z" };
  const unknown = {};
  const matches: ApiMatch[] = [
    identified,
    { matchID: 0, matchIsFinished: true },
    fallback,
    { ...fallback },
    later,
    unknown,
    {},
  ];

  assert.deepEqual(dedupeMatches(matches), [
    identified,
    fallback,
    later,
    unknown,
  ]);
  assert.equal(matches.length, 7);
});
