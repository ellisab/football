import assert from "node:assert/strict";
import test from "node:test";
import sitemap from "./sitemap";

test("sitemap excludes the retired World Cup route", () => {
  assert.equal(
    sitemap().some((entry) => entry.url.includes("world-cup")),
    false
  );
});
