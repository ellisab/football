import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET } from "./route";

const jsonResponse = (body: unknown, status: number = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
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
    assert.deepEqual(paths, ["/getmatchdata/82127"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("/api/matches rejects requests without valid ids", async () => {
  const response = await GET(
    new NextRequest("http://localhost/api/matches?ids=bad")
  );
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.match(payload.error, /ids/i);
});
