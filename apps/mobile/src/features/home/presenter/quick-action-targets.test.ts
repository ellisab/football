import assert from "node:assert/strict";
import test from "node:test";
import type { MobileHomeSection } from "./home-view-model";
import {
  getPrimaryQuickActionTarget,
  getSecondaryQuickActionTarget,
} from "./quick-action-targets";

const matchSections: MobileHomeSection[] = [
  {
    key: "next-round",
    kicker: "Nächste Runde",
    title: "28. Spieltag",
    subtitle: "Saison 2025 · kommende Spiele",
    emptyText: "Noch keine kommenden Spiele verfügbar.",
    renderKind: "matches",
    data: [],
  },
  {
    key: "matchday",
    kicker: "Spieltag",
    title: "27. Spieltag",
    subtitle: "Saison 2025",
    emptyText: "Für diese Runde sind noch keine Ergebnisse verfügbar.",
    renderKind: "matches",
    data: [],
  },
  {
    key: "table",
    kicker: "Tabelle",
    title: "Tabelle",
    subtitle: "Aktualisierte Tabelle für die ausgewählte Saison.",
    emptyText: "Tabellendaten sind noch nicht verfügbar.",
    renderKind: "table",
    data: [],
  },
];

test("prefers matchday and table when both sections are available", () => {
  assert.equal(
    getPrimaryQuickActionTarget({
      sections: matchSections,
      hasBracket: false,
    }),
    "matchday"
  );
  assert.equal(
    getSecondaryQuickActionTarget({
      sections: matchSections,
      hasTable: true,
      hasBracket: false,
    }),
    "table"
  );
});

test("falls back to the bracket when no matchday section exists", () => {
  const sectionsWithoutMatchday = matchSections.filter((section) => section.key !== "matchday");

  assert.equal(
    getPrimaryQuickActionTarget({
      sections: sectionsWithoutMatchday,
      hasBracket: true,
    }),
    "bracket"
  );
  assert.equal(
    getSecondaryQuickActionTarget({
      sections: sectionsWithoutMatchday,
      hasTable: true,
      hasBracket: true,
    }),
    "table"
  );
});

test("uses next round when table is unavailable", () => {
  const sectionsWithoutTable = matchSections.filter((section) => section.key !== "table");

  assert.equal(
    getSecondaryQuickActionTarget({
      sections: sectionsWithoutTable,
      hasTable: false,
      hasBracket: false,
    }),
    "next-round"
  );
});
