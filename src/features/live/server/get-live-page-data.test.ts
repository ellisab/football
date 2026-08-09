import assert from "node:assert/strict";
import test from "node:test";
import type { MatchdaySnapshot } from "@footballleagues/core/home";
import type { LeagueKey } from "@footballleagues/core/leagues";
import type { LiveScheduleResult } from "@footballleagues/core/live";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import { getLivePageData } from "./get-live-page-data";

const NOW = new Date("2026-07-22T18:00:00Z").getTime();

const match = ({
  finished = false,
  group = 10,
  id,
  kickoff = "2026-07-22T18:10:00Z",
  league = "bl1",
  season = 2026,
}: {
  finished?: boolean;
  group?: number;
  id: number;
  kickoff?: string;
  league?: LeagueKey;
  season?: number;
}): LiveScheduleResult["matches"][number] => ({
  effectiveShortcut: league,
  league,
  match: {
    group: {
      groupName: `${group}. Spieltag`,
      groupOrderID: group,
    },
    leagueSeason: season,
    matchDateTimeUTC: kickoff,
    matchID: id,
    matchIsFinished: finished,
    matchResults: [],
  },
  season,
});

const schedule = (
  matches: LiveScheduleResult["matches"],
  failedLeagues: LeagueKey[] = [],
): LiveScheduleResult => ({
  checkedAt: NOW - 1_000,
  failedLeagues,
  matches,
});

const refreshedMatchday = ({
  checkedAt = NOW,
  group = 10,
  league = "bl1",
  matches = [],
  season = 2026,
}: {
  checkedAt?: number;
  group?: number;
  league?: LeagueKey;
  matches?: ApiMatch[];
  season?: number;
}): MatchdaySnapshot => ({
  checkedAt,
  effectiveShortcut: league,
  group: {
    groupName: `${group}. Spieltag`,
    groupOrderID: group,
  },
  matches,
  resolvedLeague: league,
  resolvedSeason: season,
});

test("bootstrap refreshes only active scopes and deduplicates their matchday", async () => {
  const requestedGroups: number[] = [];
  const data = await getLivePageData({
    loadMatchday: async ({ group, league, season }) => {
      requestedGroups.push(group);
      return refreshedMatchday({
        group,
        league,
        season: Number(season),
      });
    },
    loadSchedule: async () =>
      schedule([
        match({ id: 1 }),
        match({ id: 2 }),
        match({
          group: 11,
          id: 3,
          kickoff: "2026-07-22T18:31:00Z",
        }),
        match({
          group: 12,
          id: 4,
          kickoff: "2026-07-22T17:30:00Z",
          finished: true,
        }),
      ]),
    now: () => NOW,
  });

  assert.deepEqual(requestedGroups, [10]);
  assert.equal(data.matches.length, 4);
  assert.equal(data.matches[0]?.competitionLabel, "Bundesliga");
  assert.equal(data.matches[0]?.roundLabel, "10. Spieltag");
  assert.deepEqual(data.matches[0]?.scope, {
    group: 10,
    league: "bl1",
    season: 2026,
  });
  assert.deepEqual(data.visibleErrors, []);
});

test("bootstrap merges a fresh matchday score into schedule matches", async () => {
  const original = match({ id: 100 });
  const updated: ApiMatch = {
    ...original.match,
    matchResults: [
      {
        pointsTeam1: 2,
        pointsTeam2: 1,
        resultOrderID: 1,
      },
    ],
  };

  const data = await getLivePageData({
    loadMatchday: async () =>
      refreshedMatchday({
        checkedAt: NOW + 500,
        matches: [updated],
      }),
    loadSchedule: async () => schedule([original]),
    now: () => NOW,
  });

  assert.equal(data.matches[0]?.match, updated);
  assert.equal(data.checkedAt, NOW + 500);
  assert.deepEqual(data.visibleErrors, []);
});

test("a failed active refresh preserves schedule matches and reports partial data", async () => {
  const original = match({ id: 100 });
  const data = await getLivePageData({
    loadMatchday: async () => {
      throw new Error("upstream failed");
    },
    loadSchedule: async () => schedule([original]),
    now: () => NOW,
  });

  assert.equal(data.matches[0]?.match, original.match);
  assert.deepEqual(data.visibleErrors, [
    "Einige Live-Spielstände sind gerade nicht verfügbar",
  ]);
});

test("active matchday refresh concurrency never exceeds three", async () => {
  let active = 0;
  let maximumActive = 0;
  const requestedGroups: number[] = [];

  const dataPromise = getLivePageData({
    loadMatchday: async ({ group }) => {
      requestedGroups.push(group);
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise<void>((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return refreshedMatchday({ group });
    },
    loadSchedule: async () =>
      schedule([
        match({ group: 1, id: 1 }),
        match({ group: 2, id: 2 }),
        match({ group: 3, id: 3 }),
        match({ group: 4, id: 4 }),
      ]),
    now: () => NOW,
  });

  const data = await dataPromise;

  assert.equal(data.matches.length, 4);
  assert.equal(maximumActive, 3);
  assert.deepEqual(
    requestedGroups.sort((a, b) => a - b),
    [1, 2, 3, 4],
  );
});

test("partial and total discovery failures have distinct fallbacks", async () => {
  const partial = await getLivePageData({
    loadMatchday: async () => {
      throw new Error("should not refresh");
    },
    loadSchedule: async () => schedule([], ["cl"]),
    now: () => NOW,
  });

  assert.deepEqual(partial, {
    checkedAt: NOW - 1_000,
    failedLeagues: ["cl"],
    matches: [],
    visibleErrors: [
      "Spielpläne einzelner Wettbewerbe sind gerade nicht verfügbar",
    ],
  });

  const total = await getLivePageData({
    loadSchedule: async () => schedule([], ["bl1", "bl2", "fbl1", "dfb", "cl"]),
    now: () => NOW,
  });

  assert.deepEqual(total, {
    checkedAt: NOW - 1_000,
    failedLeagues: ["bl1", "bl2", "fbl1", "dfb", "cl"],
    matches: [],
    visibleErrors: ["OpenLigaDB ist gerade nicht verfügbar"],
  });
});
