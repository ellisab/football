import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RefreshStatus } from "./refresh-status";

const renderStatus = (
  overrides: Partial<Parameters<typeof RefreshStatus>[0]> = {},
) =>
  renderToStaticMarkup(
    createElement(RefreshStatus, {
      isDelayed: false,
      isPending: false,
      lastChecked: null,
      onRefresh: () => {},
      pendingMessage: "Tabelle wird aktualisiert.",
      ...overrides,
    }),
  );

test("refresh status announces each pending operation and disables repeated refreshes", () => {
  for (const pendingMessage of [
    "Tabelle wird aktualisiert.",
    "Spielplan wird aktualisiert.",
    "Spielstände werden aktualisiert.",
  ]) {
    const markup = renderStatus({
      isPending: true,
      isDelayed: true,
      pendingMessage,
    });
    assert.ok(markup.includes(pendingMessage));
    assert.match(markup, /role="status" aria-live="polite" aria-atomic="true"/);
    assert.match(markup, /disabled=""/);
    assert.doesNotMatch(markup, /Datenquelle verzögert/);
  }
});

test("refresh status preserves delayed data and last-checked messages", () => {
  const lastChecked = new Date("2026-07-11T18:30:00Z");
  const time = lastChecked.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  assert.ok(
    renderStatus({ isDelayed: true, lastChecked }).includes(
      `Letzter Stand von ${time} Uhr.`,
    ),
  );
  assert.match(
    renderStatus({ isDelayed: true }),
    /Der letzte bekannte Stand wird angezeigt/,
  );
  assert.ok(
    renderStatus({ lastChecked }).includes(`Zuletzt geprüft um ${time} Uhr.`),
  );
  assert.match(renderStatus(), /alle 45 Sekunden/);
  assert.doesNotMatch(renderStatus(), /disabled=""/);
});
