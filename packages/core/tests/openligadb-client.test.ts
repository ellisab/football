import assert from "node:assert/strict";
import test from "node:test";
import {
  getAvailableLeagues,
  getCurrentGroup,
  getGroups,
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
