import assert from "node:assert/strict";
import test from "node:test";
import { buildNationsLeagueTable } from "../src/openligadb/nations-league-table";
import type { ApiMatch } from "../src/openligadb/types";

const fixture = (
  groupName: string,
  home: number,
  away: number,
  goals?: [number, number],
): ApiMatch => ({
  group: { groupName },
  team1: { teamId: home },
  team2: { teamId: away },
  matchIsFinished: !!goals,
  matchResults: goals
    ? [{ resultTypeID: 2, pointsTeam1: goals[0], pointsTeam2: goals[1] }]
    : [],
});
test("four groups include teams yet to play", () => {
  const rows = buildNationsLeagueTable(
    [],
    ["A", "B", "C", "D"].flatMap((group, i) => [
      fixture(`Gruppe ${group}`, i * 4 + 1, i * 4 + 2, [1, 0]),
      fixture(`Gruppe ${group}`, i * 4 + 3, i * 4 + 4),
    ]),
  );
  assert.equal(rows.length, 16);
  for (const group of ["A1", "A2", "A3", "A4"]) {
    const teams = rows.filter((row) => row.teamGroupName === group);
    assert.equal(teams.length, 4);
    assert.equal(teams[0].points, 3);
    assert.equal(teams.filter((row) => row.matches === 0).length, 2);
  }
});
test("historical groups exclude knockout and unfinished scores", () => {
  const rows = buildNationsLeagueTable(
    [],
    [
      fixture("Gruppe 1", 1, 2, [2, 0]),
      fixture("Viertelfinale", 1, 3, [9, 0]),
      { ...fixture("Gruppe 1", 1, 2, [5, 0]), matchIsFinished: false },
    ],
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0].teamGroupName, "A1");
  assert.equal(rows[0].goals, 2);
  assert.equal(rows[0].points, 3);
  assert.equal(rows[0].matches, 1);
});
test("head-to-head precedes overall goal difference", () => {
  const rows = buildNationsLeagueTable(
    [],
    [
      fixture("Group A1", 1, 2, [1, 0]),
      fixture("Group A1", 2, 3, [5, 0]),
      fixture("Group A1", 3, 1, [1, 0]),
      fixture("Group A1", 1, 4, [1, 0]),
      fixture("Group A1", 2, 4, [5, 0]),
    ],
  );
  assert.deepEqual(
    rows.map((row) => row.teamInfoId),
    [1, 2, 3, 4],
  );
});
test("missing assignments cannot silently produce a combined table", () => {
  assert.throws(
    () =>
      buildNationsLeagueTable(
        [{ teamInfoId: 1 }],
        [fixture("1. Spieltag", 1, 2)],
      ),
    /assignments unavailable/,
  );
});
