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

test("/api/matches returns fresh single-match payloads for requested ids", async () => {
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

    if (path === "/getmatchdata/82127") {
      return jsonResponse({
        matchID: 82127,
        matchResults: [{ pointsTeam1: 0, pointsTeam2: 1 }],
      });
    }

    return jsonResponse({ path }, 404);
  };

  try {
    const response = await GET(
      new NextRequest("http://localhost/api/matches?ids=82127,82127,bad")
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.matches.length, 1);
    assert.equal(payload.matches[0]?.matchID, 82127);
    assert.match(response.headers.get("cache-control") ?? "", /public/);
    assert.match(response.headers.get("cache-control") ?? "", /s-maxage/);
    assert.deepEqual(paths, ["/getmatchdata/82127"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("/api/matches never shared-caches a partial response", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const path = new URL(url).pathname;

    if (path === "/getmatchdata/82128") {
      return jsonResponse({ matchID: 82128, matchResults: [] });
    }

    return jsonResponse({ path }, 404);
  };

  try {
    const response = await GET(
      new NextRequest("http://localhost/api/matches?ids=82128,82129")
    );
    const payload = await response.json();
    const cacheControl = response.headers.get("cache-control") ?? "";

    assert.equal(response.status, 200);
    assert.deepEqual(
      payload.matches.map((match: { matchID: number }) => match.matchID),
      [82128]
    );
    assert.match(cacheControl, /no-store/);
    assert.doesNotMatch(cacheControl, /public/);
    assert.doesNotMatch(cacheControl, /s-maxage/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("/api/matches returns a non-cacheable 404 when every match is absent", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => jsonResponse({ error: "not found" }, 404);

  try {
    const response = await GET(
      new NextRequest("http://localhost/api/matches?ids=82130,82131")
    );
    const payload = await response.json();
    const cacheControl = response.headers.get("cache-control") ?? "";

    assert.equal(response.status, 404);
    assert.deepEqual(payload.matches, []);
    assert.match(payload.error, /could not be loaded/i);
    assert.match(cacheControl, /no-store/);
    assert.doesNotMatch(cacheControl, /public/);
    assert.doesNotMatch(cacheControl, /s-maxage/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("/api/matches preserves 429 and stops scheduling more lookups", async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  const paths: string[] = [];

  console.warn = () => undefined;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = input instanceof URL ? input : new URL(String(input));
    paths.push(url.pathname);
    return jsonResponse({ error: "slow down" }, 429, {
      "retry-after": "30",
    });
  };

  try {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/matches?ids=82140,82141,82142,82143,82144"
      )
    );
    const payload = await response.json();
    const cacheControl = response.headers.get("cache-control") ?? "";

    assert.equal(response.status, 429);
    assert.deepEqual(payload.matches, []);
    assert.equal(paths.length, 3);
    assert.match(cacheControl, /no-store/);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
});

test("/api/matches rejects requests without valid ids", async () => {
  const response = await GET(
    new NextRequest("http://localhost/api/matches?ids=bad")
  );
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.match(payload.error, /ids/i);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
});
