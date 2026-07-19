import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import type { CompetitionMatch, TeamSummary } from "@/features/football/view-utils";
import {
  MatchCardList,
  type MatchCardItem,
} from "./match-card-list";
import { MatchDetailView } from "./match-detail-view";
import { MatchList } from "./match-summary";
import { SculptedMatch } from "./sculpted-match";
import { TeamDetailView } from "./teams-view";

const scheduledMatch: ApiMatch = {
  matchID: 42,
  matchDateTimeUTC: "2099-12-31T20:00:00Z",
  leagueName: "UEFA Champions League",
  leagueShortcut: "ucl",
  leagueSeason: 2099,
  group: { groupName: "Halbfinale" },
  team1: { teamId: 1, teamName: "FC Beispiel" },
  team2: { teamId: 2, teamName: "Sporting Muster" },
  matchIsFinished: false,
};

const renderMatch = (href?: string) =>
  renderToStaticMarkup(
    createElement(SculptedMatch, {
      competitionLabel: "Champions League",
      href,
      match: scheduledMatch,
      roundLabel: "Halbfinale",
    })
  );

const competitionMatch: CompetitionMatch = {
  competition: {
    resolvedLeague: "cl",
    resolvedSeason: 2099,
  } as unknown as CompetitionMatch["competition"],
  match: scheduledMatch,
};

const preparedMatch: MatchCardItem = {
  competitionId: "cl",
  competitionLabel: "Champions League",
  match: scheduledMatch,
  roundLabel: "Halbfinale",
};

test("keeps the shared match card linked in match lists", () => {
  const markup = renderMatch("/matches/42");

  assert.match(markup, /<a class="featured-match focus-ring"[^>]*href="\/matches\/42"/);
  assert.match(markup, /class="featured-match__meta"/);
  assert.match(markup, /class="featured-match__board"/);
  assert.match(markup, />21:00</);
  assert.match(markup, />Geplant</);
  assert.match(markup, /Spiel öffnen/);
});

test("renders feeds with the canonical shared match-list wrapper", () => {
  const markup = renderToStaticMarkup(
    createElement(MatchList, { matches: [competitionMatch] })
  );

  assert.match(markup, /^<div class="match-list match-list--sculpted">/);
  assert.match(markup, /<a class="featured-match focus-ring"[^>]*href="\/matches\/42"/);
  assert.match(markup, /Champions League/);
  assert.match(markup, /Halbfinale/);
});

test("renders prepared client feeds with the canonical shared card", () => {
  const markup = renderToStaticMarkup(
    createElement(MatchCardList, { matches: [preparedMatch] })
  );

  assert.match(markup, /^<div class="match-list match-list--sculpted">/);
  assert.match(markup, /<a class="featured-match focus-ring"[^>]*href="\/matches\/42"/);
  assert.match(markup, /Champions League/);
  assert.match(markup, /Halbfinale/);
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
  assert.match(markup, /<h1 class="sr-only">FC Beispiel gegen Sporting Muster<\/h1>/);
  assert.match(markup, /<article class="featured-match" aria-label="Spiel: /);
  assert.match(markup, /class="match-detail-support"/);
  assert.match(markup, /class="match-detail-meta"/);
  assert.match(markup, /class="match-detail-team-actions"/);
  assert.doesNotMatch(markup, /href="\/matches\/42"/);
  assert.doesNotMatch(markup, /match-scoreboard|match-detail-score/);
});

test("uses canonical match feeds on team detail", () => {
  const team: TeamSummary = {
    competitions: [
      { label: "Champions League", league: "cl", season: 2099 },
    ],
    id: "fc-beispiel",
    name: "FC Beispiel",
    recentMatches: [competitionMatch],
    upcomingMatches: [competitionMatch],
  };
  const markup = renderToStaticMarkup(createElement(TeamDetailView, { team }));

  assert.match(markup, /class="page-shell match-feed-page team-detail-page"/);
  assert.equal(
    (markup.match(/class="match-list match-list--sculpted"/g) ?? []).length,
    2
  );
});
