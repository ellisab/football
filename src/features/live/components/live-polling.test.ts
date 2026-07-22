import assert from "node:assert/strict";
import test from "node:test";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import {
  getPollingScopes,
  mergeMatchdayPayload,
  parseMatchdayPollingPayload,
  type LiveMatchItem,
  type LiveMatchScope,
} from "./live-polling";

const scope: LiveMatchScope = { group: 10, league: "bl1", season: 2025 };

const item = (
  match: ApiMatch,
  itemScope: LiveMatchScope | null = scope
): LiveMatchItem => ({
  competitionId: itemScope?.league ?? "bl1",
  competitionLabel: "Bundesliga",
  match,
  roundLabel: "10. Spieltag",
  scope: itemScope ?? undefined,
});

test("polling scopes deduplicate an active matchday", () => {
  const now = new Date("2026-07-22T18:00:00Z");
  const scopes = getPollingScopes(
    [
      item({
        matchDateTimeUTC: "2026-07-22T17:30:00Z",
        matchID: 1,
        matchIsFinished: false,
      }),
      item({
        matchDateTimeUTC: "2026-07-22T18:30:00Z",
        matchID: 2,
        matchIsFinished: false,
      }),
    ],
    now
  );

  assert.deepEqual(scopes, [scope]);
});

test("polling omits finished, distant, undated, and old matches", () => {
  const now = new Date("2026-07-22T18:00:00Z");
  const scopes = getPollingScopes(
    [
      item({
        matchDateTimeUTC: "2026-07-22T17:30:00Z",
        matchID: 1,
        matchIsFinished: true,
      }),
      item({
        matchDateTimeUTC: "2026-07-22T18:31:00Z",
        matchID: 2,
        matchIsFinished: false,
      }),
      item({
        matchDateTimeUTC: "2026-07-22T11:59:59Z",
        matchID: 3,
        matchIsFinished: false,
      }),
      item({ matchID: 4, matchIsFinished: false }),
      item(
        {
          matchDateTimeUTC: "2026-07-22T17:30:00Z",
          matchID: 5,
          matchIsFinished: false,
        },
        null
      ),
    ],
    now
  );

  assert.deepEqual(scopes, []);
});

test("payload validation rejects data for a different scope", () => {
  const payload = {
    group: { groupOrderID: 10 },
    matches: [],
    resolvedLeague: "bl2",
    resolvedSeason: 2025,
  };

  assert.equal(parseMatchdayPollingPayload(payload, scope), undefined);
  assert.ok(
    parseMatchdayPollingPayload(
      { ...payload, resolvedLeague: "bl1" },
      scope
    )
  );
});

test("payload merging updates only the exact competition and matchday", () => {
  const original = item({
    matchDateTimeUTC: "2026-07-22T18:00:00Z",
    matchID: 100,
    matchIsFinished: false,
    matchResults: [],
  });
  const other = item(
    {
      matchDateTimeUTC: "2026-07-22T18:00:00Z",
      matchID: 100,
      matchIsFinished: false,
      matchResults: [],
    },
    { group: 10, league: "bl2", season: 2025 }
  );
  const updated: ApiMatch = {
    ...original.match,
    matchResults: [
      { pointsTeam1: 1, pointsTeam2: 0, resultOrderID: 1 },
    ],
  };

  const merged = mergeMatchdayPayload([original, other], {
    group: { groupOrderID: 10 },
    matches: [updated],
    resolvedLeague: "bl1",
    resolvedSeason: 2025,
  });

  assert.equal(merged[0]?.match, updated);
  assert.equal(merged[1], other);
});
