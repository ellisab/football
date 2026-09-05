import assert from "node:assert/strict";
import test from "node:test";
import {
  createSearchIndex,
  normalizeSearchText,
  rankSearchIndex,
  rankSearchResults,
  type SearchResultItem,
  scoreSearchItem,
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

test("prepared search preserves weighted ranking, fuzzy matching, and stable ties across queries", () => {
  const candidates: SearchResultItem[] = [
    { id: "exact", kind: "team", label: "Dortmund", href: "/exact" },
    {
      id: "alias",
      kind: "team",
      label: "BVB",
      aliases: ["Dortmund"],
      href: "/alias",
    },
    {
      id: "keyword",
      kind: "match",
      label: "Spiel",
      keywords: ["Dortmund"],
      href: "/keyword",
    },
    {
      id: "description",
      kind: "match",
      label: "Partie",
      description: "Dortmund",
      href: "/description",
    },
    { id: "tie", kind: "team", label: "Dortmund", href: "/tie" },
  ];
  const index = createSearchIndex(candidates);
  assert.deepEqual(
    rankSearchIndex(index, "Dortmund").map(({ item, score }) => [
      item.id,
      score,
    ]),
    [
      ["exact", 1200],
      ["tie", 1200],
      ["alias", 1080],
      ["keyword", 936],
      ["description", 744],
    ],
  );
  assert.deepEqual(
    rankSearchIndex(index, "dortmud", { kinds: ["team"], limit: 2 }).map(
      ({ item }) => item.id,
    ),
    ["exact", "tie"],
  );
  assert.deepEqual(rankSearchIndex(index, "!!!"), []);
  assert.deepEqual(rankSearchIndex(index, "Dortmund", { limit: 0 }), []);
  assert.deepEqual(rankSearchIndex(index, "handball"), []);
});

test("rebuilding the search index picks up changed items without retaining old candidates", () => {
  const original = createSearchIndex(items);
  const updated = createSearchIndex([
    { id: "7", kind: "team", label: "Köln", href: "/teams/7" },
  ]);
  assert.equal(rankSearchIndex(original, "Dortmund")[0]?.item.id, "7");
  assert.deepEqual(rankSearchIndex(updated, "Dortmund"), []);
  assert.equal(rankSearchIndex(updated, "Koln")[0]?.item.label, "Köln");
  assert.equal(rankSearchIndex(original, "BVB")[0]?.item.id, "7");
});

test("normalizeSearchText folds European names and punctuation", () => {
  assert.equal(
    normalizeSearchText("  Borussia Mönchengladbach  "),
    "borussia monchengladbach",
  );
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
    [],
  );
  assert.equal(
    rankSearchResults(broadItems, "bundesliga", { limit: 1 }).length,
    1,
  );
  assert.deepEqual(
    rankSearchResults(broadItems, "bundesliga", { limit: 0 }),
    [],
  );
});
