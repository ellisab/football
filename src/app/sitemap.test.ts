import assert from "node:assert/strict";
import test from "node:test";
import sitemap from "./sitemap";

test("sitemap contains exactly the supported competition routes", () => {
  assert.deepEqual(
    sitemap()
      .map((entry) => new URL(entry.url).pathname)
      .filter((path) => path.startsWith("/competitions/")),
    [
      "/competitions/bundesliga-1",
      "/competitions/bundesliga-2",
      "/competitions/women",
      "/competitions/dfb-pokal",
      "/competitions/champions-league",
    ]
  );
});
