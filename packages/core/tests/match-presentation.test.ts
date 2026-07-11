import assert from "node:assert/strict";
import test from "node:test";
import {
  createMatchPresentation,
  getMatchPresentationStatus,
  parseBerlinDateQuery,
  shiftBerlinDateQuery,
} from "../src/index";

test("match presentation distinguishes scheduled, estimated live, finished, and unknown states", () => {
  const now = new Date("2026-07-11T18:00:00Z");

  assert.equal(
    getMatchPresentationStatus(
      { matchDateTimeUTC: "2026-07-11T19:00:00Z", matchIsFinished: false },
      now
    ),
    "scheduled"
  );
  assert.equal(
    getMatchPresentationStatus(
      { matchDateTimeUTC: "2026-07-11T17:00:00Z", matchIsFinished: false },
      now
    ),
    "live-estimate"
  );
  assert.equal(
    getMatchPresentationStatus(
      { matchDateTimeUTC: "2026-07-11T12:00:00Z", matchIsFinished: false },
      now
    ),
    "status-unknown"
  );
  assert.equal(
    getMatchPresentationStatus(
      { matchIsFinished: true },
      now
    ),
    "finished"
  );
  assert.equal(
    getMatchPresentationStatus(
      { matchIsFinished: false },
      now
    ),
    "status-unknown"
  );
});

test("match presentation preserves missing score values and provides German accessible text", () => {
  const presentation = createMatchPresentation(
    {
      matchDateTimeUTC: "2026-07-11T17:00:00Z",
      matchIsFinished: false,
      matchResults: [
        {
          pointsTeam1: 2,
          resultOrderID: 2,
          resultTypeID: 2,
        },
      ],
      team1: { teamName: "Bayern München" },
      team2: { teamName: "Borussia Dortmund" },
    },
    { now: new Date("2026-07-11T18:00:00Z") }
  );

  assert.deepEqual(presentation.score, {
    team1: 2,
    team2: null,
    label: "2:-",
  });
  assert.equal(presentation.statusLabel, "Läuft möglicherweise");
  assert.equal(
    presentation.screenReaderLabel,
    "Bayern München gegen Borussia Dortmund, läuft möglicherweise."
  );
});

test("match presentation announces a complete finished score concisely", () => {
  const presentation = createMatchPresentation({
    matchIsFinished: true,
    matchResults: [
      {
        pointsTeam1: 2,
        pointsTeam2: 1,
        resultOrderID: 2,
        resultTypeID: 2,
      },
    ],
    team1: { teamName: "Bayern München" },
    team2: { teamName: "Borussia Dortmund" },
  });

  assert.equal(
    presentation.screenReaderLabel,
    "Bayern München 2, Borussia Dortmund 1, beendet."
  );
});

test("Berlin date query parsing rejects malformed and impossible calendar dates", () => {
  assert.equal(parseBerlinDateQuery("2026-07-11"), "2026-07-11");
  assert.equal(parseBerlinDateQuery(" 2026-07-11 "), "2026-07-11");
  assert.equal(parseBerlinDateQuery("2026-02-29"), undefined);
  assert.equal(parseBerlinDateQuery("2024-02-29"), "2024-02-29");
  assert.equal(parseBerlinDateQuery("2026-13-01"), undefined);
  assert.equal(parseBerlinDateQuery("11-07-2026"), undefined);
  assert.equal(parseBerlinDateQuery(["2026-07-11", "2026-07-12"]), undefined);
});

test("Berlin date query shifting crosses month, year, and DST boundaries as calendar days", () => {
  assert.equal(shiftBerlinDateQuery("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftBerlinDateQuery("2026-03-29", 1), "2026-03-30");
  assert.equal(shiftBerlinDateQuery("2026-10-25", -1), "2026-10-24");
  assert.equal(shiftBerlinDateQuery("2026-02-30", 1), undefined);
  assert.equal(shiftBerlinDateQuery("2026-07-11", 1.5), undefined);
});
