import assert from "node:assert/strict";
import test from "node:test";
import type { HomeSnapshot } from "@footballleagues/core/home";
import {
  IncompleteSnapshotError,
  requireCacheableHomeSnapshot,
} from "./home-snapshot-cache-policy";

const homeSnapshot = (errorKeys: HomeSnapshot["errorKeys"] = []) =>
  ({
    availableGroups: [],
    bracketMatches: [],
    currentRound: { matches: [] },
    errorKeys,
    hasTable: false,
    leagueOptions: [],
    nextRound: { matches: [] },
    resolvedLeague: "bl1",
    resolvedSeason: 2025,
    table: [],
  }) satisfies HomeSnapshot;

test("snapshot validation accepts complete fixture data", () => {
  const snapshot = homeSnapshot();
  assert.equal(requireCacheableHomeSnapshot(snapshot), snapshot);
});

test("snapshot validation rejects fixture-critical errors", () => {
  assert.throws(
    () => requireCacheableHomeSnapshot(homeSnapshot(["matchday"])),
    (error) =>
      error instanceof IncompleteSnapshotError &&
      error.errorKeys.includes("matchday"),
  );
});

test("snapshot validation preserves the upstream rate-limit status", () => {
  assert.throws(
    () =>
      requireCacheableHomeSnapshot({
        ...homeSnapshot(),
        rateLimited: true,
      }),
    (error) => error instanceof IncompleteSnapshotError && error.status === 429,
  );
});
