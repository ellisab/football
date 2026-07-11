import assert from "node:assert/strict";
import test from "node:test";
import {
  getAvailableLeagues,
  getAllMatches,
  getCurrentGroup,
  getGroups,
  getMatchById,
  getMatchesByTeamId,
  OPENLIGADB_CACHE_SECONDS,
} from "../src/openligadb";

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
    await getAllMatches("wm26", 2026, {
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

test("OpenLigaDB client does not retry non-transient 404 responses", async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;

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
  } finally {
    globalThis.fetch = originalFetch;
  }
});
