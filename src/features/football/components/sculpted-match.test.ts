import assert from "node:assert/strict";
import test from "node:test";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  CompetitionMatch,
  TeamSummary,
} from "@/features/football/view-utils";
import type { WebCompetitionViewModel } from "@/features/home/presenter/home-view-model";
import { type MatchCardItem, MatchCardList } from "./match-card-list";
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
      competitionId: "cl",
      competitionLabel: "Champions League",
      href,
      match: scheduledMatch,
      roundLabel: "Halbfinale",
    }),
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

  assert.match(
    markup,
    /<a class="featured-match focus-ring featured-match--has-dock"[^>]*href="\/matches\/42"/,
  );
  assert.match(markup, /class="featured-match__meta"/);
  assert.match(markup, /class="featured-match__board"/);
  assert.match(markup, />21:00</);
  assert.match(markup, />Geplant</);
  assert.match(markup, /Spiel öffnen/);
});

test("renders feeds with the canonical shared match-list wrapper", () => {
  const markup = renderToStaticMarkup(
    createElement(MatchList, { matches: [competitionMatch] }),
  );

  assert.match(markup, /^<div class="match-list match-list--sculpted">/);
  assert.match(
    markup,
    /<a class="featured-match focus-ring featured-match--has-dock"[^>]*href="\/matches\/42"/,
  );
  assert.match(markup, /Champions League/);
  assert.match(markup, /Halbfinale/);
});

test("renders prepared client feeds with the canonical shared card", () => {
  const markup = renderToStaticMarkup(
    createElement(MatchCardList, { matches: [preparedMatch] }),
  );

  assert.match(markup, /^<div class="match-list match-list--sculpted">/);
  assert.match(
    markup,
    /<a class="featured-match focus-ring featured-match--has-dock"[^>]*href="\/matches\/42"/,
  );
  assert.match(markup, /Champions League/);
  assert.match(markup, /Halbfinale/);
});

test("renders the exact shared card without a self-link on match detail", () => {
  const markup = renderMatch();

  assert.match(
    markup,
    /<article class="featured-match featured-match--has-dock" aria-label="Spiel: /,
  );
  assert.match(markup, /class="featured-match__meta"/);
  assert.match(markup, /class="featured-match__board"/);
  assert.doesNotMatch(markup, /href="\/matches\/42"/);
  assert.doesNotMatch(markup, /focus-ring/);
  assert.doesNotMatch(markup, /Spiel öffnen/);
});

test("uses the shared card as the match-detail hero", () => {
  const markup = renderToStaticMarkup(
    createElement(MatchDetailView, { match: scheduledMatch }),
  );

  assert.match(markup, /class="page-shell match-detail-page"/);
  assert.match(
    markup,
    /<h1 class="sr-only">FC Beispiel gegen Sporting Muster<\/h1>/,
  );
  assert.match(
    markup,
    /<article class="featured-match featured-match--has-dock" aria-label="Spiel: /,
  );
  assert.match(markup, /class="match-detail-support"/);
  assert.match(markup, /class="match-detail-meta"/);
  assert.match(markup, /class="match-detail-team-actions"/);
  assert.doesNotMatch(markup, /href="\/matches\/42"/);
  assert.doesNotMatch(markup, /match-scoreboard|match-detail-score/);
});

test("uses canonical match feeds on team detail", () => {
  const team: TeamSummary = {
    competitions: [{ label: "Champions League", league: "cl", season: 2099 }],
    id: "fc-beispiel",
    name: "FC Beispiel",
    recentMatches: [competitionMatch],
    upcomingMatches: [competitionMatch],
  };
  const markup = renderToStaticMarkup(createElement(TeamDetailView, { team }));

  assert.match(markup, /class="page-shell match-feed-page team-detail-page"/);
  assert.equal(
    (markup.match(/class="match-list match-list--sculpted"/g) ?? []).length,
    2,
  );
});

test("renders a free-TV-first broadcaster dock from canonical match context", () => {
  const opener: MatchCardItem = {
    competitionId: "bl2",
    competitionLabel: "2. Bundesliga",
    match: {
      group: { groupName: "1. Spieltag", groupOrderID: 1 },
      leagueSeason: 2026,
      matchDateTimeUTC: "2026-08-07T18:30:00Z",
      matchID: 202607,
      team1: { teamId: 10, teamName: "VfL Bochum" },
      team2: { teamId: 20, teamName: "Hertha BSC" },
    },
    roundLabel: "1. Spieltag",
  };
  const markup = renderToStaticMarkup(
    createElement(MatchCardList, { matches: [opener] }),
  );

  assert.match(markup, /class="featured-match__broadcast-dock"/);
  assert.match(markup, /data-broadcaster="sat1"/);
  assert.match(markup, /data-broadcaster="sky"/);
  assert.match(markup, /data-broadcaster="wow"/);
  assert.equal(
    (markup.match(/class="featured-match__broadcast-list"/g) ?? []).length,
    1,
  );
  assert.doesNotMatch(markup, /featured-match__broadcast-side/);
  assert.match(
    markup,
    /featured-match__broadcast-label[\s\S]*data-broadcaster="sat1"[\s\S]*data-broadcaster="sky"[\s\S]*data-broadcaster="wow"[\s\S]*featured-match__broadcast-date">07\.08\.2026/,
  );
  assert.match(
    markup,
    /class="featured-match__broadcast-dock"[\s\S]*<\/div><\/div><span class="featured-match__affordance"/,
  );
  assert.doesNotMatch(markup, /<small>/);
  assert.doesNotMatch(markup, />Übertragung</);
  assert.match(
    markup,
    /aria-label="Spiel: .*Datum: 07\.08\.2026\. Übertragung: SAT\.1, Kostenlos, TV, Einzelspiel, privater Anbieter; Sky Sport Bundesliga, Abo, TV, Einzelspiel, privater Anbieter; WOW, Abo, Stream, Einzelspiel, privater Anbieter"/,
  );
  assert.equal((markup.match(/<a /g) ?? []).length, 1);
  assert.doesNotMatch(markup, /href="https:\/\/(?:www\.)?(?:sky|wowtv|sat1)/);
});

test("labels DAZN as a conference without misrepresenting the individual games", () => {
  const markup = renderToStaticMarkup(
    createElement(SculptedMatch, {
      competitionId: "bl1",
      competitionLabel: "Bundesliga",
      match: {
        group: { groupName: "1. Spieltag", groupOrderID: 1 },
        leagueSeason: 2026,
        matchDateTimeUTC: "2026-08-29T13:30:00Z",
        matchID: 202608,
        team1: { teamId: 30, teamName: "FC Beispiel" },
        team2: { teamId: 40, teamName: "SV Muster" },
      },
      roundLabel: "1. Spieltag",
    }),
  );

  assert.match(markup, /data-broadcaster="dazn"/);
  assert.match(
    markup,
    /title="DAZN: Abo, Stream, Konferenz, privater Anbieter"/,
  );
  assert.match(markup, /DAZN, Abo, Stream, Konferenz, privater Anbieter/);
  assert.doesNotMatch(markup, /<small>/);
});

test("states when a supported fixture has no safe broadcaster inference", () => {
  const markup = renderToStaticMarkup(
    createElement(SculptedMatch, {
      competitionId: "bl1",
      competitionLabel: "Bundesliga",
      match: {
        leagueSeason: 2026,
        matchDateTimeUTC: "2026-08-28T17:00:00Z",
        matchID: 202609,
        team1: { teamId: 50, teamName: "FC Offen" },
        team2: { teamId: 60, teamName: "SV Offen" },
      },
      roundLabel: "Spieltag offen",
    }),
  );

  assert.match(markup, /data-state="unconfirmed"/);
  assert.match(markup, /Sender noch nicht bestätigt/);
  assert.match(
    markup,
    /Sender noch nicht bestätigt[\s\S]*featured-match__broadcast-date">28\.08\.2026/,
  );
  assert.doesNotMatch(markup, /Keine Übertragung/);
});

test("renders a date-only dock for DFB-Pokal", () => {
  const markup = renderToStaticMarkup(
    createElement(SculptedMatch, {
      competitionId: "dfb",
      competitionLabel: "DFB-Pokal",
      match: {
        leagueSeason: 2026,
        matchDateTimeUTC: "2026-08-30T13:00:00Z",
        matchID: 202611,
        team1: { teamId: 90, teamName: "FC Beispiel" },
        team2: { teamId: 100, teamName: "SV Muster" },
      },
      roundLabel: "1. Runde",
    }),
  );

  assert.match(markup, /featured-match featured-match--has-dock/);
  assert.match(
    markup,
    /class="featured-match__broadcast-dock" data-state="date-only"/,
  );
  assert.match(markup, /class="featured-match__broadcast-date">30\.08\.2026/);
  assert.match(markup, /aria-label="Spiel: .*Datum: 30\.08\.2026\."/);
  assert.doesNotMatch(markup, /featured-match__broadcast-label/);
  assert.doesNotMatch(markup, /featured-match__broadcast-list/);
  assert.doesNotMatch(markup, /featured-match__broadcast-empty/);
  assert.doesNotMatch(markup, /data-broadcaster=/);
  assert.doesNotMatch(markup, /lucide-tv/);
  assert.doesNotMatch(markup, /Sender noch nicht bestätigt|Übertragung:/);
});

test("renders a date-only dock for Champions League outside a known rights cycle", () => {
  const markup = renderMatch();

  assert.match(markup, /featured-match featured-match--has-dock/);
  assert.match(
    markup,
    /class="featured-match__broadcast-dock" data-state="date-only"/,
  );
  assert.match(markup, /featured-match__broadcast-date">31\.12\.2099/);
  assert.match(markup, /Datum: 31\.12\.2099\./);
  assert.doesNotMatch(markup, /Übertragung:/);
});

test("renders DAZN and the date for a Champions League Wednesday match", () => {
  const markup = renderToStaticMarkup(
    createElement(SculptedMatch, {
      competitionId: "cl",
      competitionLabel: "Champions League",
      match: {
        ...scheduledMatch,
        leagueSeason: 2026,
        matchDateTimeUTC: "2026-09-16T19:00:00Z",
      },
      roundLabel: "Ligaphase",
    }),
  );

  assert.match(markup, /featured-match featured-match--has-dock/);
  assert.match(markup, /data-broadcaster="dazn"/);
  assert.match(markup, /featured-match__broadcast-date">16\.09\.2026/);
  assert.match(markup, /Übertragung: DAZN/);
});

test("shows DAZN, Prime Video, and the date for Champions League Tuesday", () => {
  const markup = renderToStaticMarkup(
    createElement(SculptedMatch, {
      competitionId: "cl",
      competitionLabel: "Champions League",
      match: {
        ...scheduledMatch,
        leagueSeason: 2026,
        matchDateTimeUTC: "2026-09-15T19:00:00Z",
      },
      roundLabel: "Ligaphase",
    }),
  );

  assert.match(markup, /data-state="available"/);
  assert.match(markup, /data-broadcaster="prime-video"/);
  assert.match(markup, /data-broadcaster="dazn"/);
  assert.match(markup, /featured-match__broadcast-date">15\.09\.2026/);
});

test("renders broadcasters on match detail from resolved competition context", () => {
  const match: ApiMatch = {
    group: { groupName: "2. Spieltag", groupOrderID: 2 },
    leagueSeason: 2026,
    matchDateTimeUTC: "2026-08-14T16:30:00Z",
    matchID: 202610,
    team1: { teamId: 70, teamName: "FC Detail" },
    team2: { teamId: 80, teamName: "SV Detail" },
  };
  const competition = {
    resolvedLeague: "bl2",
    resolvedSeason: 2026,
  } as WebCompetitionViewModel;
  const markup = renderToStaticMarkup(
    createElement(MatchDetailView, { competition, match }),
  );

  assert.match(markup, /class="featured-match__broadcast-dock"/);
  assert.match(markup, /data-broadcaster="sky"/);
  assert.match(markup, /data-broadcaster="wow"/);
  assert.doesNotMatch(markup, /href="\/matches\/202610"/);
});
