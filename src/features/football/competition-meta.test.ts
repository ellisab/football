import assert from "node:assert/strict";
import test from "node:test";
import {
  getCompetitionCatalog,
  getLeagueKeyFromSlug,
} from "./competition-meta";

test("competition catalog contains exactly the supported routes", () => {
  assert.deepEqual(
    getCompetitionCatalog().map(({ key, href }) => ({ key, href })),
    [
      { key: "bl1", href: "/competitions/bundesliga-1" },
      { key: "bl2", href: "/competitions/bundesliga-2" },
      { key: "fbl1", href: "/competitions/women" },
      { key: "dfb", href: "/competitions/dfb-pokal" },
      { key: "cl", href: "/competitions/champions-league" },
    ]
  );
  assert.equal(getLeagueKeyFromSlug("unsupported"), undefined);
});
