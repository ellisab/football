import assert from "node:assert/strict";
import test from "node:test";
import type { LivePageData } from "@/features/live/server/get-live-page-data";
import { buildLiveScopesResponse } from "./route";

const liveData = (
  overrides: Partial<LivePageData> = {}
): LivePageData => ({
  checkedAt: Date.parse("2026-07-22T18:00:00Z"),
  failedLeagues: [],
  matches: [],
  visibleErrors: [],
  ...overrides,
});

test("/api/live-scopes shares healthy discovery for five minutes", async () => {
  const response = buildLiveScopesResponse(liveData());

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("cache-control") ?? "",
    /s-maxage=300/
  );
  assert.deepEqual(await response.json(), liveData());
});

test("/api/live-scopes caches partial data for a shorter period", () => {
  const response = buildLiveScopesResponse(
    liveData({
      matches: [
        {
          competitionId: "bl1",
          competitionLabel: "Bundesliga",
          match: { matchID: 100, matchIsFinished: false },
          roundLabel: "1. Spieltag",
        },
      ],
      visibleErrors: ["Ein Wettbewerb ist gerade nicht verfügbar"],
    })
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control") ?? "", /s-maxage=60/);
});

test("/api/live-scopes preserves client candidates on total failure", () => {
  const response = buildLiveScopesResponse(
    liveData({ visibleErrors: ["OpenLigaDB ist gerade nicht verfügbar"] })
  );

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("retry-after"), "60");
  assert.match(response.headers.get("cache-control") ?? "", /s-maxage=60/);
});
