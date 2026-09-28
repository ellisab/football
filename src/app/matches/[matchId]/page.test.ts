import assert from "node:assert/strict";
import test from "node:test";
import MatchPage from "./page";

const match = {
  matchID: 85228,
  leagueShortcut: "nla",
  leagueSeason: 2026,
  group: { groupOrderID: 2 },
  matchDateTimeUTC: "2026-10-01T18:45:00Z",
};
const page = (matchId = "85228") =>
  MatchPage({ params: Promise.resolve({ matchId }) });

test("match pages fetch by ID without loading homepage data", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith("/getmatchdata/85228")) return Response.json(match);
    assert.ok(url.endsWith("/getmatchbygroup/nla/2/2026"));
    return Response.json([
      { matchID: 3, matchDateTimeUTC: "2026-10-02T18:45:00Z" },
      { matchID: 1, matchDateTimeUTC: "2026-09-24T18:45:00Z" },
    ]);
  };
  try {
    const result = await page();
    assert.equal(result.props.match.matchID, 85228);
    assert.equal(result.props.previousMatch.matchID, 1);
    assert.equal(result.props.nextMatch.matchID, 3);
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("historical match remains visible when adjacent fixtures fail", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    if (String(input).endsWith("/getmatchdata/85228"))
      return Response.json({ ...match, leagueSeason: 2024 });
    assert.ok(String(input).endsWith("/getmatchbygroup/nla/2/2024"));
    throw new TypeError("offline");
  };
  try {
    const result = await page();
    assert.equal(result.props.match.leagueSeason, 2024);
    assert.equal(result.props.nextMatch, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("only invalid or missing matches produce 404; outages reach error boundary", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("must not fetch");
  };
  try {
    for (const id of ["0", "abc", "85228junk", "9007199254740992"]) {
      await assert.rejects(page(id), /NEXT_HTTP_ERROR_FALLBACK;404/);
    }
    globalThis.fetch = async () => new Response("Not found", { status: 404 });
    await assert.rejects(page(), /NEXT_HTTP_ERROR_FALLBACK;404/);
    globalThis.fetch = async () => {
      throw new TypeError("network unavailable");
    };
    await assert.rejects(page(), /network unavailable/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
