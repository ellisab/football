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

test("/api/home rejects unsupported league keys without loading data", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;

  globalThis.fetch = async () => {
    fetchCalled = true;
    return jsonResponse({});
  };

  try {
    const response = await GET(
      new NextRequest("http://localhost/api/home?league=unsupported&season=2026")
    );
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.match(payload.error, /not found/i);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("/api/home does not cache a fixture-critical partial snapshot", async () => {
  const originalFetch = globalThis.fetch;

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
      case "/getcurrentgroup/bl1":
        return jsonResponse({ error: "unavailable" }, 404);
      case "/getbltable/bl1/2025":
      case "/getavailablegroups/bl1/2025":
        return jsonResponse([]);
      default:
        return jsonResponse({ path }, 404);
    }
  };

  try {
    const response = await GET(
      new NextRequest("http://localhost/api/home?league=bl1&season=2025")
    );
    const payload = await response.json();
    const cacheControl = response.headers.get("cache-control") ?? "";

    assert.equal(response.status, 502);
    assert.match(payload.error, /could not be loaded completely/i);
    assert.match(cacheControl, /no-store/);
    assert.doesNotMatch(cacheControl, /public/);
    assert.doesNotMatch(cacheControl, /s-maxage/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("/api/home preserves 429 for a rate-limited partial snapshot", async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;

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
            leagueName: "Bundesliga 2099/2100",
            leagueSeason: 2099,
            sport: { sportName: "Fußball" },
          },
        ]);
      case "/getcurrentgroup/bl1":
        return jsonResponse({
          groupID: 1,
          groupName: "1. Spieltag",
          groupOrderID: 1,
        });
      case "/getavailablegroups/bl1/2099":
        return jsonResponse([
          { groupID: 1, groupName: "1. Spieltag", groupOrderID: 1 },
        ]);
      case "/getbltable/bl1/2099":
        return jsonResponse({ error: "slow down" }, 429, {
          "retry-after": "30",
        });
      default:
        return jsonResponse({ path }, 404);
    }
  };

  try {
    const response = await GET(
      new NextRequest("http://localhost/api/home?league=bl1&season=2099")
    );
    const cacheControl = response.headers.get("cache-control") ?? "";

    assert.equal(response.status, 429);
    assert.match(cacheControl, /no-store/);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
});
