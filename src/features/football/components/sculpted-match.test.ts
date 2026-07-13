import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import { MatchDetailView } from "./match-detail-view";
import { SculptedMatch } from "./sculpted-match";

const scheduledMatch: ApiMatch = {
  matchID: 42,
  matchDateTimeUTC: "2099-12-31T20:00:00Z",
  leagueName: "FIFA-Weltmeisterschaft",
  leagueSeason: 2099,
  group: { groupName: "Halbfinale" },
  team1: { teamId: 1, teamName: "Frankreich" },
  team2: { teamId: 2, teamName: "Spanien" },
  matchIsFinished: false,
};

const renderMatch = (href?: string) =>
  renderToStaticMarkup(
    createElement(SculptedMatch, {
      competitionLabel: "FIFA-Weltmeisterschaft",
      href,
      match: scheduledMatch,
      roundLabel: "Halbfinale",
    })
  );

test("keeps the shared match card linked in match lists", () => {
  const markup = renderMatch("/matches/42");

  assert.match(markup, /<a class="featured-match focus-ring"[^>]*href="\/matches\/42"/);
  assert.match(markup, /class="featured-match__meta"/);
  assert.match(markup, /class="featured-match__board"/);
  assert.match(markup, />21:00</);
  assert.match(markup, />Geplant</);
  assert.match(markup, /Spiel öffnen/);
});

test("renders the exact shared card without a self-link on match detail", () => {
  const markup = renderMatch();

  assert.match(markup, /<article class="featured-match" aria-label="Spiel: /);
  assert.match(markup, /class="featured-match__meta"/);
  assert.match(markup, /class="featured-match__board"/);
  assert.doesNotMatch(markup, /href="\/matches\/42"/);
  assert.doesNotMatch(markup, /focus-ring/);
  assert.doesNotMatch(markup, /Spiel öffnen/);
});

test("uses the shared card as the match-detail hero", () => {
  const markup = renderToStaticMarkup(
    createElement(MatchDetailView, { match: scheduledMatch })
  );

  assert.match(markup, /class="page-shell match-detail-page"/);
  assert.match(markup, /<h1 class="sr-only">Frankreich gegen Spanien<\/h1>/);
  assert.match(markup, /<article class="featured-match" aria-label="Spiel: /);
  assert.match(markup, /class="match-detail-support"/);
  assert.match(markup, /class="match-detail-meta"/);
  assert.match(markup, /class="match-detail-team-actions"/);
  assert.doesNotMatch(markup, /href="\/matches\/42"/);
  assert.doesNotMatch(markup, /match-scoreboard|match-detail-score/);
});
