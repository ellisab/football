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
    assert.equal(payload.resolvedLeague, "bl1");
    assert.equal(payload.group.groupOrderID, 10);
    assert.equal(payload.matches[0]?.matchID, 100);
    assert.deepEqual(
      paths.filter((path) => path.startsWith("/getmatchdata")),
      ["/getmatchdata/bl1/2025/10"]
    );
    assert.equal(paths.includes("/getmatchdata/bl2/2025/10"), false);
    assert.equal(paths.includes("/getcurrentgroup/bl1"), false);
    assert.equal(paths.includes("/getbltable/bl1/2025"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
