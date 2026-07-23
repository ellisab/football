import assert from "node:assert/strict";
import test from "node:test";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import {
  getPollingScopes,
  mergeLiveDiscovery,
  mergeMatchdayPayload,
  parseLiveDiscoveryPayload,
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

test("live discovery replaces candidates while preserving fresher local scores", () => {
  const current = item({
    matchDateTimeUTC: "2026-07-22T18:00:00Z",
    matchID: 100,
    matchIsFinished: false,
    matchResults: [
      { pointsTeam1: 2, pointsTeam2: 1, resultOrderID: 1 },
    ],
  });
  const removed = item({
    matchDateTimeUTC: "2026-07-22T19:00:00Z",
    matchID: 200,
    matchIsFinished: false,
  });
  const rediscovered = item({
    matchDateTimeUTC: "2026-07-22T18:00:00Z",
    matchID: 100,
    matchIsFinished: false,
    matchResults: [],
  });
  const added = item({
    matchDateTimeUTC: "2026-07-22T20:00:00Z",
    matchID: 300,
    matchIsFinished: false,
  });

  const merged = mergeLiveDiscovery(
    [current, removed],
    [rediscovered, added]
  );

  assert.deepEqual(
    merged.map((entry) => entry.match.matchID),
    [100, 300]
  );
  assert.equal(merged[0]?.match, current.match);
  assert.equal(merged[1], added);
});

test("live discovery identity includes the competition", () => {
  const bundesliga = item({
    matchID: 100,
    matchIsFinished: false,
    matchResults: [
      { pointsTeam1: 1, pointsTeam2: 0, resultOrderID: 1 },
    ],
  });
  const secondLeague = item(
    {
      matchID: 100,
      matchIsFinished: false,
      matchResults: [],
    },
    { group: 10, league: "bl2", season: 2025 }
  );

  const merged = mergeLiveDiscovery([bundesliga], [secondLeague]);

  assert.equal(merged[0], secondLeague);
});

test("live discovery payload validation rejects malformed candidates", () => {
  const validPayload = {
    checkedAt: Date.parse("2026-07-22T18:00:00Z"),
    failedLeagues: [],
    matches: [
      item({
        matchID: 100,
        matchIsFinished: false,
      }),
    ],
    visibleErrors: [],
  };

  assert.deepEqual(parseLiveDiscoveryPayload(validPayload), validPayload);
  assert.equal(
    parseLiveDiscoveryPayload({
      ...validPayload,
      matches: [{ competitionId: "bl1" }],
    }),
    undefined
  );
  assert.equal(
    parseLiveDiscoveryPayload({
      ...validPayload,
      visibleErrors: [503],
    }),
    undefined
  );
  assert.equal(
    parseLiveDiscoveryPayload({
      ...validPayload,
      failedLeagues: ["unsupported"],
    }),
    undefined
  );
});

test("partial discovery retains candidates from failed competitions", () => {
  const retained = item(
    {
      matchDateTimeUTC: "2026-07-22T18:30:00Z",
      matchID: 200,
      matchIsFinished: false,
    },
    { group: 10, league: "bl2", season: 2025 }
  );
  const removed = item({
    matchDateTimeUTC: "2026-07-22T19:00:00Z",
    matchID: 100,
    matchIsFinished: false,
  });
  const discovered = item({
    matchDateTimeUTC: "2026-07-22T20:00:00Z",
    matchID: 300,
    matchIsFinished: false,
  });

  const merged = mergeLiveDiscovery(
    [removed, retained],
    [discovered],
    ["bl2"]
  );

  assert.deepEqual(
    merged.map((entry) => entry.match.matchID),
    [200, 300]
  );
  assert.equal(merged[0], retained);
});
