import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeSearchText,
  rankSearchResults,
  scoreSearchItem,
  type SearchResultItem,
} from "./search-ranking";

const items: SearchResultItem[] = [
  {
    id: "bl1",
    kind: "competition",
    label: "Bundesliga",
    href: "/competitions/bundesliga-1",
    aliases: ["1. Bundesliga"],
  },
  {
    id: "7",
    kind: "team",
    label: "Borussia Dortmund",
    href: "/teams/7",
    aliases: ["BVB"],
  },
  {
    id: "40",
    kind: "team",
    label: "FC Bayern München",
    href: "/teams/40",
    keywords: ["Munich"],
  },
  {
    id: "11",
    kind: "matchday",
    label: "11. Spieltag",
    href: "/competitions/bundesliga-1?season=2025&matchday=11",
    aliases: ["Spieltag elf"],
  },
];

test("normalizeSearchText folds European names and punctuation", () => {
  assert.equal(normalizeSearchText("  Borussia Mönchengladbach  "), "borussia monchengladbach");
  assert.equal(normalizeSearchText("Preußen Münster"), "preussen munster");
  assert.equal(normalizeSearchText("1. FC Köln"), "1 fc koln");
  assert.equal(normalizeSearchText("ŁKS Łódź"), "lks lodz");
});

test("rankSearchResults prioritizes labels, then aliases and keywords", () => {
  assert.equal(rankSearchResults(items, "bundesliga")[0]?.item.id, "bl1");
  assert.equal(rankSearchResults(items, "BVB")[0]?.item.id, "7");
  assert.equal(rankSearchResults(items, "munich")[0]?.item.id, "40");
  assert.equal(rankSearchResults(items, "11 spieltag")[0]?.item.id, "11");
});

test("ranking tolerates small typing errors without matching unrelated items", () => {
  assert.ok(scoreSearchItem(items[1] as SearchResultItem, "dortmud") > 0);
  assert.equal(rankSearchResults(items, "dortmud")[0]?.item.id, "7");
  assert.deepEqual(rankSearchResults(items, "handball"), []);
});

test("ranking supports kind filters and result limits", () => {
  const broadItems: SearchResultItem[] = [
    ...items,
    {
      id: "match-1",
      kind: "match",
      label: "Bundesliga: Bayern gegen Dortmund",
      href: "/matches/1",
    },
  ];

  assert.deepEqual(
    rankSearchResults(broadItems, "bundesliga", { kinds: ["team"] }),
    []
  );
  assert.equal(rankSearchResults(broadItems, "bundesliga", { limit: 1 }).length, 1);
  assert.deepEqual(rankSearchResults(broadItems, "bundesliga", { limit: 0 }), []);
});
