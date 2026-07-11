import assert from "node:assert/strict";
import test from "node:test";
import {
  EMPTY_FAVORITES,
  FAVORITES_STORAGE_VERSION,
  isFavorite,
  parseFavoritesStorage,
  parseFavoritesValue,
  serializeFavorites,
  updateFavorite,
} from "./favorites-storage";

test("parseFavoritesStorage fails closed for missing or malformed data", () => {
  assert.deepEqual(parseFavoritesStorage(null), EMPTY_FAVORITES);
  assert.deepEqual(parseFavoritesStorage("not-json"), EMPTY_FAVORITES);
  assert.deepEqual(parseFavoritesStorage("[]"), EMPTY_FAVORITES);
});

test("parseFavoritesValue migrates legacy fields and typed favorites", () => {
  assert.deepEqual(
    parseFavoritesValue({
      version: 0,
      competitions: ["bl1", " bl1 ", "wc", null],
      teams: [40, "7", ""],
    }),
    {
      competitionIds: ["bl1", "wc"],
      teamIds: ["40", "7"],
    }
  );

  assert.deepEqual(
    parseFavoritesValue({
      favorites: [
        { kind: "competition", id: "cl" },
        { kind: "team", id: 91 },
        { kind: "unknown", id: "ignored" },
      ],
    }),
    {
      competitionIds: ["cl"],
      teamIds: ["91"],
    }
  );
});

test("future storage versions are ignored instead of guessed", () => {
  assert.deepEqual(
    parseFavoritesValue({
      version: FAVORITES_STORAGE_VERSION + 1,
      competitionIds: ["bl1"],
      teamIds: ["40"],
    }),
    EMPTY_FAVORITES
  );
});

test("current empty collections are not repopulated from stale legacy fields", () => {
  assert.deepEqual(
    parseFavoritesValue({
      version: FAVORITES_STORAGE_VERSION,
      competitionIds: [],
      teamIds: [],
      favorites: [
        { kind: "competition", id: "wc" },
        { kind: "team", id: "40" },
      ],
    }),
    EMPTY_FAVORITES
  );
});

test("favorites serialize as versioned data and update immutably", () => {
  const selected = updateFavorite(EMPTY_FAVORITES, "competition", "bl1", true);
  const withTeam = updateFavorite(selected, "team", 40, true);
  const removed = updateFavorite(withTeam, "competition", "bl1", false);

  assert.equal(isFavorite(withTeam, "competition", "bl1"), true);
  assert.equal(isFavorite(withTeam, "team", "40"), true);
  assert.equal(isFavorite(removed, "competition", "bl1"), false);
  assert.equal(isFavorite(withTeam, "competition", "bl1"), true);
  assert.deepEqual(JSON.parse(serializeFavorites(withTeam)), {
    version: FAVORITES_STORAGE_VERSION,
    competitionIds: ["bl1"],
    teamIds: ["40"],
  });
});
