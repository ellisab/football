import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StandingsCard } from "./standings-card";

test("four group tables restart positions at one", () => {
  const table = ["A1", "A2", "A3", "A4"].flatMap((teamGroupName, group) =>
    Array.from({ length: 4 }, (_, team) => ({
      teamInfoId: group * 4 + team + 1,
      teamName: `Team ${group * 4 + team + 1}`,
      teamGroupName,
    })),
  );
  const html = renderToStaticMarkup(createElement(StandingsCard, { table }));
  assert.equal((html.match(/<table\b/g) ?? []).length, 4);
  for (const group of ["A1", "A2", "A3", "A4"])
    assert.ok(html.includes(`Gruppe ${group}`));
  assert.equal((html.match(/>1<\/td>/g) ?? []).length, 4);
  assert.ok(!html.includes(">5</td>"));
});
test("domestic leagues retain a single table", () => {
  const html = renderToStaticMarkup(
    createElement(StandingsCard, {
      table: [{ teamInfoId: 1, teamName: "Team" }],
    }),
  );
  assert.equal((html.match(/<table\b/g) ?? []).length, 1);
  assert.ok(!html.includes("<h3"));
});
