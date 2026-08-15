import assert from "node:assert/strict";
import test from "node:test";
import { OPENLIGADB_CACHE_SECONDS } from "@footballleagues/core/openligadb";
import { NextRequest } from "next/server";
import { GET } from "./route";

const jsonResponse = (body: unknown, status: number = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

test("/api/table returns a fresh table without response caching", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ init?: RequestInit; path: string }> = [];

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input)).pathname;
    requests.push({ init, path });

    switch (path) {
      case "/getavailableleagues":
        return jsonResponse([
          {
            leagueName: "2. Bundesliga 2026/2027",
            leagueSeason: 2026,
            leagueShortcut: "bl2",
            sport: { sportName: "Fußball" },
          },
        ]);
      case "/getbltable/bl2/2026":
        return jsonResponse([
          {
            teamInfoId: 79,
            teamName: "1. FC Nürnberg",
            matches: 2,
            points: 6,
            goalDiff: 5,
          },
        ]);
      default:
        return jsonResponse({ path }, 404);
    }
  };

  try {
    const response = await GET(
      new NextRequest("http://localhost/api/table?league=bl2&season=2026"),
    );
    const payload = await response.json();
    const tableRequest = requests.find(({ path }) =>
      path.startsWith("/getbltable/"),
    );

    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.equal(payload.table[0]?.teamName, "1. FC Nürnberg");
    assert.equal(typeof payload.checkedAt, "number");
    assert.equal(
      tableRequest?.init?.next?.revalidate,
      OPENLIGADB_CACHE_SECONDS.liveMatchday,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("/api/table rejects invalid leagues without loading data", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return jsonResponse({});
  };

  try {
    const response = await GET(
      new NextRequest("http://localhost/api/table?league=unknown&season=2026"),
    );

    assert.equal(response.status, 400);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
