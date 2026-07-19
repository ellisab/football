import assert from "node:assert/strict";
import test from "node:test";
import {
  getCompetitionCatalog,
  getLeagueKeyFromSlug,
} from "./competition-meta";

test("retired World Cup routes are absent from the competition catalog", () => {
  assert.equal(getLeagueKeyFromSlug("world-cup"), undefined);
  assert.equal(
    getCompetitionCatalog().some(
      (competition) =>
        String(competition.key) === "wc" ||
        competition.href.includes("world-cup")
    ),
    false
  );
});
