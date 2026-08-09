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

test("/api/matchday returns the requested matchday without response caching", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ init?: RequestInit; path: string }> = [];

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input)).pathname;
    requests.push({ init, path });

    switch (path) {
      case "/getavailableleagues":
        return jsonResponse([
          {
            leagueName: "Bundesliga 2025/2026",
            leagueSeason: 2025,
            leagueShortcut: "bl1",
            sport: { sportName: "Fußball" },
          },
        ]);
      case "/getavailablegroups/bl1/2025":
        return jsonResponse([
          { groupID: 10, groupName: "10. Spieltag", groupOrderID: 10 },
        ]);
      case "/getmatchdata/bl1/2025/10":
        return jsonResponse([{ matchID: 100, matchIsFinished: true }]);
      default:
        return jsonResponse({ path }, 404);
    }
  };

  try {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/matchday?league=bl1&season=2025&group=10",
      ),
    );
    const payload = await response.json();
    const matchdayRequest = requests.find(({ path }) =>
      path.startsWith("/getmatchdata/"),
    );

    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.equal(payload.matches[0]?.matchID, 100);
    assert.equal(
      matchdayRequest?.init?.next?.revalidate,
      OPENLIGADB_CACHE_SECONDS.liveMatchday,
    );
    assert.equal(
      requests.some(({ path }) => path.startsWith("/getlastchangedate/")),
      false,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("/api/matchday rejects invalid scopes without loading data", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return jsonResponse({});
  };

  try {
    const response = await GET(
      new NextRequest("http://localhost/api/matchday?league=bl1"),
    );

    assert.equal(response.status, 400);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
