import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { NextRequest } from "next/server";
import { clearOpenLigaDbMemoryCache } from "@footballleagues/core/openligadb";
import { GET } from "./route";

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

test("/api/matchday loads only the requested matchday", async () => {
  const originalFetch = globalThis.fetch;
  const paths: string[] = [];

  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const path = new URL(url).pathname;
    paths.push(path);

    switch (path) {
      case "/getavailableleagues":
        return jsonResponse([
          {
            leagueShortcut: "bl1",
            leagueName: "Bundesliga 2025/2026",
            leagueSeason: 2025,
            sport: { sportName: "Fußball" },
          },
          {
            leagueShortcut: "bl2",
            leagueName: "2. Bundesliga 2025/2026",
            leagueSeason: 2025,
            sport: { sportName: "Fußball" },
          },
        ]);
      case "/getavailablegroups/bl1/2025":
        return jsonResponse([
          { groupID: 10, groupName: "10. Spieltag", groupOrderID: 10 },
          { groupID: 11, groupName: "11. Spieltag", groupOrderID: 11 },
        ]);
      case "/getlastchangedate/bl1/2025/10":
        return jsonResponse("2026-07-04T18:00:00");
      case "/getmatchdata/bl1/2025/10":
        return jsonResponse([
          {
            matchID: 100,
            matchDateTimeUTC: "2026-07-04T18:00:00Z",
            matchIsFinished: false,
            matchResults: [],
            team1: { teamId: 1, teamName: "Team A" },
            team2: { teamId: 2, teamName: "Team B" },
          },
        ]);
      default:
        return jsonResponse({ path }, 404);
    }
  };

  try {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/matchday?league=bl1&season=2025&group=10"
      )
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control") ?? "", /public/);
    assert.match(response.headers.get("cache-control") ?? "", /s-maxage/);
    assert.equal(payload.resolvedLeague, "bl1");
    assert.equal(payload.group.groupOrderID, 10);
    assert.equal(payload.matches[0]?.matchID, 100);
    assert.deepEqual(
      paths.filter((path) => path.startsWith("/getmatchdata")),
      ["/getmatchdata/bl1/2025/10"]
    );
    assert.deepEqual(
      paths.filter((path) => path.startsWith("/getlastchangedate")),
      ["/getlastchangedate/bl1/2025/10"]
    );
    assert.equal(paths.includes("/getmatchdata/bl2/2025/10"), false);
    assert.equal(paths.includes("/getcurrentgroup/bl1"), false);
    assert.equal(paths.includes("/getbltable/bl1/2025"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("/api/matchday returns errors with no-store cache policy", async () => {
  const response = await GET(
    new NextRequest("http://localhost/api/matchday?league=bl1")
  );
  const payload = await response.json();
  const cacheControl = response.headers.get("cache-control") ?? "";

  assert.equal(response.status, 400);
  assert.match(payload.error, /group/i);
  assert.match(cacheControl, /no-store/);
  assert.doesNotMatch(cacheControl, /public/);
  assert.doesNotMatch(cacheControl, /s-maxage/);
});

test("/api/matchday rejects unsupported league keys without loading data", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;

  globalThis.fetch = async () => {
    fetchCalled = true;
    return jsonResponse({});
  };

  try {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/matchday?league=unsupported&season=2026&group=1"
      )
    );
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.match(payload.error, /unsupported league/i);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("/api/matchday shares a stale response for the active backoff window", async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  let lastChanged = "2026-07-04T18:00:00";
  let refreshShouldFail = false;

  console.warn = () => undefined;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const path = new URL(url).pathname;

    switch (path) {
      case "/getavailableleagues":
        return jsonResponse([
          {
            leagueShortcut: "bl1",
            leagueName: "Bundesliga 2025/2026",
            leagueSeason: 2025,
            sport: { sportName: "Fußball" },
          },
        ]);
      case "/getavailablegroups/bl1/2025":
        return jsonResponse([
          { groupID: 20, groupName: "20. Spieltag", groupOrderID: 20 },
        ]);
      case "/getlastchangedate/bl1/2025/20":
        return jsonResponse(lastChanged);
      case "/getmatchdata/bl1/2025/20":
        if (refreshShouldFail) {
          return jsonResponse({ error: "unavailable" }, 503, {
            "retry-after": "0",
          });
        }
        return jsonResponse([
          {
            matchID: 200,
            matchDateTimeUTC: "2026-07-04T18:00:00Z",
            matchIsFinished: false,
            matchResults: [],
            team1: { teamId: 1, teamName: "Team A" },
            team2: { teamId: 2, teamName: "Team B" },
          },
        ]);
      default:
        return jsonResponse({ path }, 404);
    }
  };

  try {
    const request = new NextRequest(
      "http://localhost/api/matchday?league=bl1&season=2025&group=20"
    );
    const first = await GET(request);
    assert.equal(first.status, 200);

    lastChanged = "2026-07-04T18:05:00";
    refreshShouldFail = true;
    clearOpenLigaDbMemoryCache();
    const stale = await GET(request);
    const payload = await stale.json();
    const cacheControl = stale.headers.get("cache-control") ?? "";

    assert.equal(stale.status, 200);
    assert.equal(payload.matches[0]?.matchID, 200);
    assert.equal(payload.refreshFailed, true);
    assert.equal(payload.refreshState, "stale");
    assert.match(cacheControl, /public/);
    assert.match(cacheControl, /s-maxage/);
    assert.ok(Number(stale.headers.get("retry-after")) >= 1);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
});
