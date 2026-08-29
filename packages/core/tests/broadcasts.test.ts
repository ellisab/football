import assert from "node:assert/strict";
import test from "node:test";
import {
  getMatchBroadcasts,
  MANUAL_BROADCAST_OVERRIDE_ISSUES,
  type ManualBroadcastOverride,
  validateManualBroadcastOverrides,
} from "../src/broadcasts";
import type { ApiMatch } from "../src/openligadb";

const createMatch = (overrides: Partial<ApiMatch> = {}): ApiMatch => ({
  group: { groupOrderID: 2, groupName: "2. Spieltag" },
  leagueSeason: 2026,
  matchDateTimeUTC: "2026-08-07T16:30:00Z",
  matchID: 42,
  team1: { teamId: 1, teamName: "FC Beispiel" },
  team2: { teamId: 2, teamName: "SV Muster" },
  ...overrides,
});

const signatures = (
  result: ReturnType<typeof getMatchBroadcasts>,
): string[] => {
  return result.broadcasts.map(
    (broadcast) => `${broadcast.id}:${broadcast.coverage}`,
  );
};

test("static manual broadcast overrides are valid", () => {
  assert.deepEqual(MANUAL_BROADCAST_OVERRIDE_ISSUES, []);
});

test("uses verified RTL assignments for the published 2. Bundesliga top matches", () => {
  const matchdayOne = getMatchBroadcasts({
    competitionId: "bl2",
    match: createMatch({
      matchDateTimeUTC: "2026-08-08T18:30:00Z",
      matchID: 83510,
      team1: { teamId: 131, teamName: "VfL Wolfsburg" },
      team2: { teamId: 76, teamName: "1. FC Kaiserslautern" },
    }),
  });
  const matchdayTwo = getMatchBroadcasts({
    competitionId: "bl2",
    match: createMatch({
      matchDateTimeUTC: "2026-08-15T18:30:00Z",
      matchID: 83527,
      team1: { teamId: 76, teamName: "1. FC Kaiserslautern" },
      team2: { teamId: 105, teamName: "Karlsruher SC" },
    }),
  });

  for (const result of [matchdayOne, matchdayTwo]) {
    assert.deepEqual(signatures(result), [
      "rtl:individual",
      "sky:individual",
      "wow:individual",
      "rtl-plus:individual",
    ]);
    assert.ok(result.broadcasts.every((item) => item.certainty === "verified"));
  }
});

test("uses verified SAT.1 assignments for both published 2025/26 winter games", () => {
  const beforeWinterBreak = getMatchBroadcasts({
    competitionId: "bl1",
    match: createMatch({
      leagueSeason: 2025,
      matchDateTimeUTC: "2025-12-19T19:30:00Z",
      matchID: 77382,
      team1: { teamId: 7, teamName: "Borussia Dortmund" },
      team2: { teamId: 87, teamName: "Borussia Mönchengladbach" },
    }),
  });
  const afterWinterBreak = getMatchBroadcasts({
    competitionId: "bl1",
    match: createMatch({
      leagueSeason: 2025,
      matchDateTimeUTC: "2026-01-09T19:30:00Z",
      matchID: 77393,
      team1: { teamId: 91, teamName: "Eintracht Frankfurt" },
      team2: { teamId: 7, teamName: "Borussia Dortmund" },
    }),
  });

  for (const result of [beforeWinterBreak, afterWinterBreak]) {
    assert.deepEqual(signatures(result), [
      "sat1:individual",
      "sky:individual",
      "wow:individual",
    ]);
    assert.ok(result.broadcasts.every((item) => item.certainty === "verified"));
  }
});

test("validates override keys, signatures, sources, and broadcaster IDs", () => {
  const result = validateManualBroadcastOverrides([
    {
      awayTeamId: 2,
      broadcasters: [
        { broadcasterId: "not-a-channel", coverage: "individual" },
      ],
      competitionId: "bl2",
      homeTeamId: 1,
      kickoffUtc: "2026-08-08T18:30:00Z",
      matchId: 42,
      matchKey: "bl2:wrong",
      season: 2026,
      sourceUrl: "http://example.com",
      verifiedAt: "not-a-date",
    },
  ]);

  assert.equal(result.overrides.length, 0);
  assert.ok(result.issues.length > 0);
});

test("derives the Bundesliga weekend rights in Berlin local time", () => {
  const opener = getMatchBroadcasts({
    competitionId: "bl1",
    match: createMatch({
      group: { groupOrderID: 1 },
      matchDateTimeUTC: "2026-08-28T18:30:00Z",
    }),
  });
  const regularFriday = getMatchBroadcasts({
    competitionId: "bl1",
    match: createMatch({
      matchDateTimeUTC: "2026-09-11T18:30:00Z",
    }),
  });
  const saturdayAfternoon = getMatchBroadcasts({
    competitionId: "bl1",
    match: createMatch({
      matchDateTimeUTC: "2026-08-29T13:30:00Z",
    }),
  });
  const saturdayEvening = getMatchBroadcasts({
    competitionId: "bl1",
    match: createMatch({
      matchDateTimeUTC: "2026-08-29T16:30:00Z",
    }),
  });
  const sunday = getMatchBroadcasts({
    competitionId: "bl1",
    match: createMatch({
      matchDateTimeUTC: "2026-08-30T15:30:00Z",
    }),
  });

  assert.deepEqual(signatures(opener), [
    "sat1:individual",
    "sky:individual",
    "wow:individual",
  ]);
  assert.deepEqual(signatures(regularFriday), [
    "sky:individual",
    "wow:individual",
  ]);
  assert.deepEqual(signatures(saturdayAfternoon), [
    "sky:individual",
    "wow:individual",
    "dazn:conference",
  ]);
  assert.deepEqual(signatures(saturdayEvening), [
    "sky:individual",
    "wow:individual",
  ]);
  assert.deepEqual(signatures(sunday), ["dazn:individual"]);
});

test("derives Bundesliga midweek individual and conference rights", () => {
  const tuesdayEarly = getMatchBroadcasts({
    competitionId: "bl1",
    match: createMatch({
      matchDateTimeUTC: "2027-01-12T17:30:00Z",
    }),
  });
  const tuesdayLate = getMatchBroadcasts({
    competitionId: "bl1",
    match: createMatch({
      matchDateTimeUTC: "2027-01-12T19:30:00Z",
    }),
  });
  const wednesdayLate = getMatchBroadcasts({
    competitionId: "bl1",
    match: createMatch({
      matchDateTimeUTC: "2027-01-13T19:30:00Z",
    }),
  });
  const thursday = getMatchBroadcasts({
    competitionId: "bl1",
    match: createMatch({
      matchDateTimeUTC: "2027-01-14T19:30:00Z",
    }),
  });

  assert.deepEqual(signatures(tuesdayEarly), [
    "sky:individual",
    "wow:individual",
  ]);
  assert.deepEqual(signatures(tuesdayLate), [
    "sky:individual",
    "wow:individual",
    "dazn:conference",
  ]);
  assert.deepEqual(signatures(wednesdayLate), [
    "sky:individual",
    "wow:individual",
    "dazn:conference",
  ]);
  assert.deepEqual(signatures(thursday), ["sky:individual", "wow:individual"]);
});

test("derives all-match and free-TV rules for the 2. Bundesliga", () => {
  const standard = getMatchBroadcasts({
    competitionId: "bl2",
    match: createMatch(),
  });
  const opener = getMatchBroadcasts({
    competitionId: "bl2",
    match: createMatch({
      group: { groupOrderID: 1 },
      matchDateTimeUTC: "2026-08-07T18:30:00Z",
    }),
  });
  const saturdayTopMatch = getMatchBroadcasts({
    competitionId: "bl2",
    match: createMatch({
      matchDateTimeUTC: "2026-08-08T18:30:00Z",
    }),
  });
  const missingKickoff = getMatchBroadcasts({
    competitionId: "bl2",
    match: createMatch({
      matchDateTime: undefined,
      matchDateTimeUTC: undefined,
    }),
  });

  assert.deepEqual(signatures(standard), ["sky:individual", "wow:individual"]);
  assert.deepEqual(signatures(opener), [
    "sat1:individual",
    "sky:individual",
    "wow:individual",
  ]);
  assert.deepEqual(signatures(saturdayTopMatch), [
    "rtl-nitro:individual",
    "sky:individual",
    "wow:individual",
    "rtl-plus:individual",
  ]);
  assert.deepEqual(signatures(missingKickoff), [
    "sky:individual",
    "wow:individual",
  ]);
});

test("handles summer time, winter time, and zone-less Berlin wall time", () => {
  const summer = getMatchBroadcasts({
    competitionId: "bl2",
    match: createMatch({
      matchDateTimeUTC: "2026-08-08T18:30:00Z",
    }),
  });
  const winter = getMatchBroadcasts({
    competitionId: "bl2",
    match: createMatch({
      matchDateTimeUTC: "2026-12-05T19:30:00Z",
    }),
  });
  const localWallClock = getMatchBroadcasts({
    competitionId: "bl2",
    match: createMatch({
      group: { groupOrderID: 1 },
      matchDateTime: "2026-08-07T20:30:00",
      matchDateTimeUTC: undefined,
    }),
  });

  assert.equal(signatures(summer)[0], "rtl-nitro:individual");
  assert.equal(signatures(winter)[0], "rtl-nitro:individual");
  assert.equal(signatures(localWallClock)[0], "sat1:individual");
});

test("prefers a valid UTC kickoff and falls back after an invalid one", () => {
  const utcWins = getMatchBroadcasts({
    competitionId: "bl1",
    match: createMatch({
      matchDateTime: "2026-08-30T17:30:00",
      matchDateTimeUTC: "2026-08-29T13:30:00Z",
    }),
  });
  const localFallback = getMatchBroadcasts({
    competitionId: "bl1",
    match: createMatch({
      matchDateTime: "2026-08-29T15:30:00",
      matchDateTimeUTC: "invalid",
    }),
  });

  assert.deepEqual(signatures(utcWins), [
    "sky:individual",
    "wow:individual",
    "dazn:conference",
  ]);
  assert.deepEqual(signatures(localFallback), [
    "sky:individual",
    "wow:individual",
    "dazn:conference",
  ]);
});

test("gates automatic rules to the 2025 through 2028 rights cycle", () => {
  for (const season of [2025, 2028]) {
    const supported = getMatchBroadcasts({
      competitionId: "bl2",
      match: createMatch({ leagueSeason: season }),
    });
    assert.equal(supported.status, "available");
  }

  for (const season of [2024, 2029]) {
    const unsupported = getMatchBroadcasts({
      competitionId: "bl2",
      match: createMatch({ leagueSeason: season }),
    });
    assert.deepEqual(unsupported, {
      broadcasts: [],
      status: "unsupported",
    });
  }
});

test("marks unknown Bundesliga slots as unconfirmed without inventing a sender", () => {
  const result = getMatchBroadcasts({
    competitionId: "bl1",
    match: createMatch({
      matchDateTimeUTC: "2026-08-28T17:00:00Z",
    }),
  });

  assert.deepEqual(result, { broadcasts: [], status: "unconfirmed" });
});

test("derives DAZN for non-Tuesday Champions League matches", () => {
  const result = getMatchBroadcasts({
    competitionId: "cl",
    match: createMatch({
      leagueShortcut: "bl1",
      matchDateTimeUTC: "2026-09-16T19:00:00Z",
    }),
  });

  assert.deepEqual(signatures(result), ["dazn:individual"]);
  assert.equal(result.status, "available");
});

test("shows both possible services for Champions League Tuesday", () => {
  const result = getMatchBroadcasts({
    competitionId: "cl",
    match: createMatch({ matchDateTimeUTC: "2026-09-15T19:00:00Z" }),
  });

  assert.deepEqual(signatures(result), [
    "prime-video:individual",
    "dazn:individual",
  ]);
  assert.equal(result.status, "available");
  assert.ok(
    result.broadcasts.every(
      (broadcast) =>
        broadcast.note === "Genaue Dienstag-Zuordnung noch nicht bestätigt",
    ),
  );
});

test("fails closed after the current Champions League rights cycle", () => {
  const result = getMatchBroadcasts({
    competitionId: "cl",
    match: createMatch({
      leagueSeason: 2027,
      matchDateTimeUTC: "2027-09-15T19:00:00Z",
    }),
  });

  assert.deepEqual(result, { broadcasts: [], status: "unsupported" });
});

test("uses a verified Prime Video override for its Champions League selection", () => {
  const match = createMatch({ matchDateTimeUTC: "2026-09-15T19:00:00Z" });
  const override: ManualBroadcastOverride = {
    awayTeamId: 2,
    broadcasters: [{ broadcasterId: "prime-video", coverage: "individual" }],
    competitionId: "cl",
    homeTeamId: 1,
    kickoffUtc: "2026-09-15T19:00:00Z",
    matchId: 42,
    matchKey: "cl:42",
    season: 2026,
    sourceUrl:
      "https://www.aboutamazon.de/news/entertainment/live-sport-bei-prime-video",
    verifiedAt: "2026-09-01T10:00:00Z",
  };
  const result = getMatchBroadcasts({
    competitionId: "cl",
    manualOverrides: [override],
    match,
  });

  assert.deepEqual(signatures(result), ["prime-video:individual"]);
  assert.equal(result.broadcasts[0]?.certainty, "verified");
});

test("a matching editorial override fully replaces inferred broadcasters", () => {
  const match = createMatch({
    matchDateTimeUTC: "2026-08-08T18:30:00Z",
  });
  const override: ManualBroadcastOverride = {
    awayTeamId: 2,
    broadcasters: [
      { broadcasterId: "rtl", coverage: "individual" },
      { broadcasterId: "sky", coverage: "individual" },
      { broadcasterId: "wow", coverage: "individual" },
    ],
    competitionId: "bl2",
    homeTeamId: 1,
    kickoffUtc: "2026-08-08T18:30:00Z",
    matchId: 42,
    matchKey: "bl2:42",
    note: "RTL bestätigt",
    season: 2026,
    sourceUrl: "https://www.rtl.de/sport/",
    verifiedAt: "2026-08-01T10:00:00Z",
  };
  const result = getMatchBroadcasts({
    competitionId: "bl2",
    manualOverrides: [override],
    match,
  });

  assert.deepEqual(signatures(result), [
    "rtl:individual",
    "sky:individual",
    "wow:individual",
  ]);
  assert.ok(result.broadcasts.every((item) => item.certainty === "verified"));
  assert.ok(
    result.broadcasts.every(
      (item) => item.sourceUrl === "https://www.rtl.de/sport/",
    ),
  );
});

test("an empty override suppresses an unsafe inference, while drift falls back", () => {
  const match = createMatch({
    matchDateTimeUTC: "2026-08-08T18:30:00Z",
  });
  const override: ManualBroadcastOverride = {
    awayTeamId: 2,
    broadcasters: [],
    competitionId: "bl2",
    homeTeamId: 1,
    kickoffUtc: "2026-08-08T18:30:00Z",
    matchId: 42,
    matchKey: "bl2:42",
    note: "Zuordnung nach Verlegung offen",
    season: 2026,
    sourceUrl: "https://www.bundesliga.com/de/2bundesliga/",
    verifiedAt: "2026-08-01T10:00:00Z",
  };
  const suppressed = getMatchBroadcasts({
    competitionId: "bl2",
    manualOverrides: [override],
    match,
  });
  const drifted = getMatchBroadcasts({
    competitionId: "bl2",
    manualOverrides: [override],
    match: {
      ...match,
      matchDateTimeUTC: "2026-08-08T19:30:00Z",
    },
  });

  assert.deepEqual(suppressed, { broadcasts: [], status: "unconfirmed" });
  assert.deepEqual(signatures(drifted), ["sky:individual", "wow:individual"]);
});

test("a verified override can cover a fixture outside the automatic cycle", () => {
  const match = createMatch({
    leagueSeason: 2029,
    matchDateTimeUTC: "2029-08-10T18:30:00Z",
  });
  const override: ManualBroadcastOverride = {
    awayTeamId: 2,
    broadcasters: [{ broadcasterId: "sat1", coverage: "individual" }],
    competitionId: "bl1",
    homeTeamId: 1,
    kickoffUtc: "2029-08-10T18:30:00Z",
    matchId: 42,
    matchKey: "bl1:42",
    season: 2029,
    sourceUrl: "https://www.sat1.de/sport/",
    verifiedAt: "2029-08-01T10:00:00Z",
  };
  const result = getMatchBroadcasts({
    competitionId: "bl1",
    manualOverrides: [override],
    match,
  });

  assert.deepEqual(signatures(result), ["sat1:individual"]);
  assert.equal(result.status, "available");
});
