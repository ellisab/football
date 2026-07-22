import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import {
  clearOpenLigaDbMemoryCache,
  getAvailableTeams,
  getAvailableLeagues,
  getAllMatches,
  getCurrentGroup,
  getGroups,
  getLastChangeDate,
  getMatchById,
  getMatchdayResults,
  getMatchesByGroup,
  getMatchesByTeamId,
  OPENLIGADB_CACHE_SECONDS,
  OPENLIGADB_MEMORY_CACHE_MAX_ENTRIES,
} from "../src/openligadb";

beforeEach(() => {
  clearOpenLigaDbMemoryCache();
});

const jsonResponse = (
  body: unknown,
  status: number = 200,
  headers?: HeadersInit
) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });
};

test("OpenLigaDB client retries 429 and applies endpoint cache TTL", async () => {
  const originalFetch = globalThis.fetch;
  const attempts: RequestInit[] = [];

  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    attempts.push(init ?? {});

    if (attempts.length === 1) {
      return jsonResponse({ message: "slow down" }, 429, { "retry-after": "0" });
    }

    return jsonResponse([
      {
        leagueShortcut: "bl1",
        leagueName: "Bundesliga",
        leagueSeason: 2026,
        sport: { sportName: "Fußball" },
      },
    ]);
  };

  try {
    const leagues = await getAvailableLeagues();

    assert.equal(attempts.length, 2);
    assert.equal(
      attempts[0]?.next?.revalidate,
      OPENLIGADB_CACHE_SECONDS.availableLeagues
    );
    assert.equal(leagues[0]?.leagueShortcut, "bl1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenLigaDB client ignores a non-finite Retry-After value", async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts === 1) {
      return jsonResponse({ message: "invalid delay" }, 429, {
        "retry-after": "Infinity",
      });
    }

    return jsonResponse([
      { groupID: 1, groupName: "1. Spieltag", groupOrderID: 1 },
    ]);
  };

  try {
    const groups = await getGroups("invalid-retry-after", 2026);

    assert.equal(attempts, 2);
    assert.equal(groups[0]?.groupOrderID, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenLigaDB client shares one retry sequence across concurrent identical GETs", async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  globalThis.fetch = async () => {
    attempts += 1;

    if (attempts === 1) {
      return jsonResponse({ message: "temporary" }, 503, { "retry-after": "0" });
    }

    return jsonResponse([
      {
        leagueShortcut: "bl1",
        leagueName: "Bundesliga",
        leagueSeason: 2026,
        sport: { sportName: "Fußball" },
      },
    ]);
  };

  try {
    const results = await Promise.all([
      getAvailableLeagues({ cache: "no-store" }),
      getAvailableLeagues({ cache: "no-store" }),
      getAvailableLeagues({ cache: "no-store" }),
    ]);

    assert.equal(attempts, 2);
    assert.deepEqual(
      results.map((leagues) => leagues[0]?.leagueShortcut),
      ["bl1", "bl1", "bl1"]
    );

    await getAvailableLeagues({ cache: "no-store" });
    assert.equal(attempts, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenLigaDB client reuses a successful response within its memory TTL", async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  globalThis.fetch = async () => {
    attempts += 1;
    return jsonResponse([{ leagueShortcut: "bl1" }]);
  };

  try {
    const first = await getAvailableLeagues();
    const second = await getAvailableLeagues();

    assert.equal(attempts, 1);
    assert.equal(first, second);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenLigaDB response memory cache evicts its least-recently-used entry", async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  globalThis.fetch = async () => {
    attempts += 1;
    return jsonResponse([]);
  };

  try {
    for (
      let index = 1;
      index <= OPENLIGADB_MEMORY_CACHE_MAX_ENTRIES + 1;
      index += 1
    ) {
      await getGroups(`cache-${index}`, 2026);
    }

    assert.equal(attempts, OPENLIGADB_MEMORY_CACHE_MAX_ENTRIES + 1);
    await getGroups("cache-1", 2026);
    await getGroups(
      `cache-${OPENLIGADB_MEMORY_CACHE_MAX_ENTRIES + 1}`,
      2026
    );
    assert.equal(attempts, OPENLIGADB_MEMORY_CACHE_MAX_ENTRIES + 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenLigaDB client applies a long Retry-After cooldown per endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  const originalWarn = console.warn;
  const warnings: unknown[][] = [];
  let now = 1_000;
  let upstreamCalls = 0;

  Date.now = () => now;
  console.warn = (...args: unknown[]) => warnings.push(args);
  globalThis.fetch = async (input: RequestInfo | URL) => {
    upstreamCalls += 1;

    if (upstreamCalls === 1) {
      return jsonResponse({ message: "slow down" }, 429, {
        "retry-after": "30",
      });
    }

    if (String(input).includes("/getavailablegroups/")) {
      return jsonResponse([
        { groupID: 1, groupName: "1. Spieltag", groupOrderID: 1 },
      ]);
    }

    return jsonResponse([
      {
        leagueShortcut: "bl1",
        leagueName: "Bundesliga",
        leagueSeason: 2026,
        sport: { sportName: "Fußball" },
      },
    ]);
  };

  try {
    await assert.rejects(
      () => getGroups("bl1", 2026),
      (error: unknown) => (error as { status?: number }).status === 429
    );
    await assert.rejects(
      () => getGroups("bl1", 2026),
      (error: unknown) => (error as { status?: number }).status === 429
    );

    assert.equal(upstreamCalls, 1);
    assert.equal(warnings.length, 1);
    assert.equal(
      (warnings[0]?.[0] as Record<string, unknown>).attempts,
      1
    );

    const leagues = await getAvailableLeagues();
    assert.equal(upstreamCalls, 2);
    assert.equal(leagues[0]?.leagueShortcut, "bl1");

    now += 30_001;
    const groups = await getGroups("bl1", 2026);

    assert.equal(upstreamCalls, 3);
    assert.equal(groups[0]?.groupOrderID, 1);
    assert.equal(warnings.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    Date.now = originalNow;
    console.warn = originalWarn;
  }
});

test("OpenLigaDB client does not coalesce differing or unsafe GET options", async () => {
  const originalFetch = globalThis.fetch;
  const requests: RequestInit[] = [];

  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(init ?? {});
    return jsonResponse([]);
  };

  try {
    await Promise.all([
      getCurrentGroup("bl1", { next: { revalidate: 60 } }),
      getCurrentGroup("bl1", { next: { revalidate: 120 } }),
    ]);

    assert.equal(requests.length, 2);
    assert.deepEqual(
      requests.map(({ next }) => next?.revalidate),
      [60, 120]
    );

    await Promise.all([
      getAvailableLeagues({ headers: { "x-client": "one" } }),
      getAvailableLeagues({ headers: { "x-client": "one" } }),
    ]);

    const controller = new AbortController();
    await Promise.all([
      getAvailableLeagues({ signal: controller.signal }),
      getAvailableLeagues({ signal: controller.signal }),
    ]);

    assert.equal(requests.length, 6);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenLigaDB client loads bounded team fixtures with the live TTL", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ input, init });
    return jsonResponse([{ matchID: 12 }]);
  };

  try {
    const matches = await getMatchesByTeamId(40, 8, 8);

    assert.equal(
      String(requests[0]?.input),
      "https://api.openligadb.de/getmatchesbyteamid/40/8/8"
    );
    assert.equal(
      requests[0]?.init?.next?.revalidate,
      OPENLIGADB_CACHE_SECONDS.liveMatchday
    );
    assert.equal(matches[0]?.matchID, 12);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenLigaDB client retries transient 5xx responses", async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;

  globalThis.fetch = async () => {
    attempts += 1;

    if (attempts === 1) {
      return jsonResponse({ message: "temporary" }, 503, { "retry-after": "0" });
    }

    return jsonResponse([
      { groupID: 1, groupName: "1. Spieltag", groupOrderID: 1 },
    ]);
  };

  try {
    const groups = await getGroups("bl1", 2026);

    assert.equal(attempts, 2);
    assert.equal(groups[0]?.groupOrderID, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenLigaDB client loads a single match with the live TTL", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ input, init });
    return jsonResponse({
      matchID: 82127,
      matchResults: [{ pointsTeam1: 0, pointsTeam2: 1 }],
    });
  };

  try {
    const match = await getMatchById(82127);

    assert.equal(String(requests[0]?.input), "https://api.openligadb.de/getmatchdata/82127");
    assert.equal(
      requests[0]?.init?.next?.revalidate,
      OPENLIGADB_CACHE_SECONDS.liveMatchday
    );
    assert.equal(match.matchResults?.[0]?.pointsTeam2, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenLigaDB all-season matches can use a shorter caller TTL", async () => {
  const originalFetch = globalThis.fetch;
  const requests: RequestInit[] = [];

  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(init ?? {});
    return jsonResponse([]);
  };

  try {
    await getAllMatches("cup1", 2026, {
      next: { revalidate: OPENLIGADB_CACHE_SECONDS.liveMatchday },
    });

    assert.equal(
      requests[0]?.next?.revalidate,
      OPENLIGADB_CACHE_SECONDS.liveMatchday
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenLigaDB live snapshot resources use a shorter positive caller TTL", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const callerTtl = OPENLIGADB_CACHE_SECONDS.liveMatchday;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ input, init });
    return jsonResponse([]);
  };

  try {
    await getCurrentGroup("bl1", { next: { revalidate: callerTtl } });
    await getMatchdayResults("bl1", 2026, 1, {
      next: { revalidate: callerTtl },
    });
    await getMatchesByGroup("bl1", 2026, 1, {
      next: { revalidate: callerTtl },
    });
    await getCurrentGroup("bl1", { next: { revalidate: 0 } });

    assert.deepEqual(
      requests.map(({ init }) => init?.next?.revalidate),
      [
        callerTtl,
        callerTtl,
        callerTtl,
        OPENLIGADB_CACHE_SECONDS.currentGroup,
      ]
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenLigaDB live validation preserves blocking no-store requests", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ input, init });
    return String(input).includes("/getlastchangedate/")
      ? jsonResponse("2026-07-22T18:00:00Z")
      : jsonResponse([]);
  };

  try {
    await getLastChangeDate("bl1", 2026, 1, { cache: "no-store" });
    await getMatchdayResults("bl1", 2026, 1, { cache: "no-store" });

    assert.equal(requests.length, 2);
    for (const { init } of requests) {
      assert.equal(init?.cache, "no-store");
      assert.equal(init?.next, undefined);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenLigaDB group-match fallback preserves a shorter caller TTL", async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const warnings: unknown[][] = [];
  const callerTtl = OPENLIGADB_CACHE_SECONDS.liveMatchday;

  console.warn = (...args: unknown[]) => warnings.push(args);
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ input, init });

    if (String(input).includes("/getmatchbygroup/")) {
      return jsonResponse({ message: "not found" }, 404);
    }

    return jsonResponse([{ matchID: 12 }]);
  };

  try {
    const matches = await getMatchesByGroup("bl1", 2026, 1, {
      next: { revalidate: callerTtl },
    });

    assert.equal(matches[0]?.matchID, 12);
    assert.deepEqual(
      requests.map(({ init }) => init?.next?.revalidate),
      [callerTtl, callerTtl]
    );
    assert.equal(warnings.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
});

test("OpenLigaDB group-match lookup does not fall back after rate limiting", async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  const paths: string[] = [];

  console.warn = () => undefined;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    paths.push(new URL(String(input)).pathname);
    return jsonResponse({ message: "slow down" }, 429, {
      "retry-after": "30",
    });
  };

  try {
    await assert.rejects(
      () => getMatchesByGroup("rate-limited", 2026, 1),
      (error: unknown) => (error as { status?: number }).status === 429
    );
    assert.deepEqual(paths, ["/getmatchbygroup/rate-limited/1/2026"]);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
});

test("OpenLigaDB static discovery resources keep their long TTLs", async () => {
  const originalFetch = globalThis.fetch;
  const requests: RequestInit[] = [];

  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(init ?? {});
    return jsonResponse([]);
  };

  try {
    const shortCallerOptions = {
      next: { revalidate: OPENLIGADB_CACHE_SECONDS.liveMatchday },
    };

    await getAvailableLeagues(shortCallerOptions);
    await getGroups("bl1", 2026, shortCallerOptions);
    await getAvailableTeams("bl1", 2026, shortCallerOptions);

    assert.deepEqual(
      requests.map(({ next }) => next?.revalidate),
      [
        OPENLIGADB_CACHE_SECONDS.availableLeagues,
        OPENLIGADB_CACHE_SECONDS.groups,
        OPENLIGADB_CACHE_SECONDS.teams,
      ]
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("OpenLigaDB logs a sanitized terminal network failure on one attempt", async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  const warnings: unknown[][] = [];
  let attempts = 0;
  let shouldFail = true;

  console.warn = (...args: unknown[]) => warnings.push(args);
  globalThis.fetch = async () => {
    attempts += 1;

    if (shouldFail) {
      throw new TypeError("sensitive network details");
    }

    return jsonResponse({
      groupID: 1,
      groupName: "1. Spieltag",
      groupOrderID: 1,
    });
  };

  try {
    await assert.rejects(() => getCurrentGroup("bl1"), TypeError);

    assert.equal(attempts, 1);
    assert.equal(warnings.length, 1);

    const payload = warnings[0]?.[0] as Record<string, unknown>;
    assert.equal(payload.event, "openligadb.request.failed");
    assert.equal(payload.path, "/getcurrentgroup/bl1");
    assert.equal(typeof payload.duration, "number");
    assert.equal(payload.attempts, 1);
    assert.equal(payload.status, null);
    assert.equal(payload.errorName, "TypeError");
    assert.equal(payload.classification, "network");
    assert.equal("message" in payload, false);
    assert.equal("stack" in payload, false);
    assert.equal(JSON.stringify(payload).includes("sensitive network details"), false);

    shouldFail = false;
    const recovered = await getCurrentGroup("bl1");
    assert.equal(attempts, 2);
    assert.equal(recovered.groupOrderID, 1);
    assert.equal(warnings.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
});

test("OpenLigaDB logs a sanitized terminal timeout failure", async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  const warnings: unknown[][] = [];

  console.warn = (...args: unknown[]) => warnings.push(args);
  globalThis.fetch = async () => {
    const error = new Error("sensitive timeout details");
    error.name = "TimeoutError";
    throw error;
  };

  try {
    await assert.rejects(() => getCurrentGroup("bl1"));

    assert.equal(warnings.length, 1);

    const payload = warnings[0]?.[0] as Record<string, unknown>;
    assert.equal(payload.event, "openligadb.request.failed");
    assert.equal(payload.path, "/getcurrentgroup/bl1");
    assert.equal(typeof payload.duration, "number");
    assert.equal(payload.attempts, 1);
    assert.equal(payload.status, null);
    assert.equal(payload.errorName, "TimeoutError");
    assert.equal(payload.classification, "timeout");
    assert.equal("message" in payload, false);
    assert.equal("stack" in payload, false);
    assert.equal(JSON.stringify(payload).includes("sensitive timeout details"), false);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
});

test("OpenLigaDB client does not retry non-transient 404 responses", async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  const warnings: unknown[][] = [];
  let attempts = 0;

  console.warn = (...args: unknown[]) => warnings.push(args);
  globalThis.fetch = async () => {
    attempts += 1;
    return jsonResponse({ message: "not found" }, 404);
  };

  try {
    await assert.rejects(
      () => getCurrentGroup("missing"),
      (error: unknown) => {
        assert.equal((error as { status?: number }).status, 404);
        return true;
      }
    );
    assert.equal(attempts, 1);
    assert.equal(warnings.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
});
