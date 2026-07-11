import assert from "node:assert/strict";
import test from "node:test";
import {
  getMatchScore,
  getMatchScreenReaderLabel,
  getMatchStatus,
  getMatchStatusLabel,
} from "./view-utils";

const now = new Date("2026-07-11T18:00:00Z");

test("football view status wrappers retain caller-compatible names without hiding uncertainty", () => {
  assert.equal(
    getMatchStatus(
      { matchDateTimeUTC: "2026-07-11T19:00:00Z", matchIsFinished: false },
      now
    ),
    "upcoming"
  );
  assert.equal(
    getMatchStatus(
      { matchDateTimeUTC: "2026-07-11T17:00:00Z", matchIsFinished: false },
      now
    ),
    "live"
  );
  assert.equal(
    getMatchStatus(
      { matchDateTimeUTC: "2026-07-11T12:00:00Z", matchIsFinished: false },
      now
    ),
    "unknown"
  );
  assert.equal(
    getMatchStatusLabel(
      { matchDateTimeUTC: "2026-07-11T12:00:00Z", matchIsFinished: false },
      now
    ),
    "Status unklar"
  );
});

test("football view score and accessible-label wrappers preserve incomplete results", () => {
  const match = {
    matchIsFinished: false,
    matchResults: [
      {
        pointsTeam1: 2,
        resultOrderID: 2,
        resultTypeID: 2,
      },
    ],
    team1: { teamName: "Team Eins" },
    team2: { teamName: "Team Zwei" },
  };

  assert.equal(getMatchScore(match), "2:-");
  assert.equal(
    getMatchScreenReaderLabel(match, now),
    "Team Eins gegen Team Zwei, Status unklar."
  );
});
