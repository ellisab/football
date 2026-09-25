import { getFinalResult } from "./results";
import type { ApiMatch, ApiTableRow } from "./types";

const groupName = (match: ApiMatch) => {
  const part = /^(?:Gruppe|Group)\s+(?:A([1-4])|([1-4])|([A-D]))$/i.exec(
    match.group?.groupName?.trim() ?? "",
  );
  if (!part) return undefined;
  return `A${part[1] ?? part[2] ?? String(part[3].toUpperCase().charCodeAt(0) - 64)}`;
};

const totals = (id: number, matches: ApiMatch[]) => {
  const row = {
    points: 0,
    goals: 0,
    opponentGoals: 0,
    goalDiff: 0,
    matches: 0,
    won: 0,
    draw: 0,
    lost: 0,
    awayGoals: 0,
    awayWins: 0,
  };
  for (const match of matches) {
    if (
      !match.matchIsFinished ||
      (match.team1?.teamId !== id && match.team2?.teamId !== id)
    )
      continue;
    const result = getFinalResult(match);
    if (
      typeof result?.pointsTeam1 !== "number" ||
      typeof result.pointsTeam2 !== "number"
    )
      continue;
    const home = match.team1?.teamId === id;
    const goals = home ? result.pointsTeam1 : result.pointsTeam2;
    const conceded = home ? result.pointsTeam2 : result.pointsTeam1;
    row.matches++;
    row.goals += goals;
    row.opponentGoals += conceded;
    row.goalDiff += goals - conceded;
    row.points += goals > conceded ? 3 : goals === conceded ? 1 : 0;
    row.won += Number(goals > conceded);
    row.draw += Number(goals === conceded);
    row.lost += Number(goals < conceded);
    if (!home) {
      row.awayGoals += goals;
      row.awayWins += Number(goals > conceded);
    }
  }
  return row;
};

// NLA fixtures identify groups as A–D (2026) or 1–4 (2024).
// Only group-stage fixtures count: the aggregate source table includes knockout games.
export const buildNationsLeagueTable = (
  table: ApiTableRow[],
  matches: ApiMatch[],
): ApiTableRow[] => {
  const groups = new Map<string, ApiMatch[]>();
  for (const match of matches) {
    const group = groupName(match);
    if (group) groups.set(group, [...(groups.get(group) ?? []), match]);
  }
  if (!groups.size && table.length)
    throw new Error("Nations League group assignments unavailable");
  const result: ApiTableRow[] = [];
  for (const [group, fixtures] of [...groups].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const teams = new Map<number, ApiTableRow>();
    for (const match of fixtures)
      for (const team of [match.team1, match.team2]) {
        if (team?.teamId === undefined) continue;
        teams.set(team.teamId, {
          ...table.find((row) => row.teamInfoId === team.teamId),
          teamInfoId: team.teamId,
          teamName: team.teamName,
          shortName: team.shortName,
          teamIconUrl: team.teamIconUrl,
          teamGroupName: group,
          ...totals(team.teamId, fixtures),
        });
      }
    const rankTied = (rows: ApiTableRow[]): ApiTableRow[] => {
      if (rows.length < 2) return rows;
      const ids = new Set(rows.map((row) => row.teamInfoId));
      const fixturesBetween = fixtures.filter(
        (match) => ids.has(match.team1?.teamId) && ids.has(match.team2?.teamId),
      );
      const mini = new Map(
        rows.map((row) => [
          row.teamInfoId,
          totals(row.teamInfoId as number, fixturesBetween),
        ]),
      );
      const sorted = [...rows].sort((a, b) => {
        const x = mini.get(a.teamInfoId)!;
        const y = mini.get(b.teamInfoId)!;
        return (
          y.points - x.points || y.goalDiff - x.goalDiff || y.goals - x.goals
        );
      });
      const buckets: ApiTableRow[][] = [];
      for (const row of sorted) {
        const last = buckets.at(-1);
        const x = mini.get(row.teamInfoId)!;
        const y = last && mini.get(last[0].teamInfoId)!;
        if (
          last &&
          y &&
          x.points === y.points &&
          x.goalDiff === y.goalDiff &&
          x.goals === y.goals
        )
          last.push(row);
        else buckets.push([row]);
      }
      if (buckets.length > 1) return buckets.flatMap(rankTied);
      return [...rows].sort((a, b) => {
        const x = totals(a.teamInfoId as number, fixtures);
        const y = totals(b.teamInfoId as number, fixtures);
        // Retain source order when disciplinary / access-list tie-break data is unavailable.
        return (
          y.goalDiff - x.goalDiff ||
          y.goals - x.goals ||
          y.awayGoals - x.awayGoals ||
          y.won - x.won ||
          y.awayWins - x.awayWins ||
          table.findIndex((row) => row.teamInfoId === a.teamInfoId) -
            table.findIndex((row) => row.teamInfoId === b.teamInfoId)
        );
      });
    };
    const points = [
      ...new Set([...teams.values()].map((row) => row.points ?? 0)),
    ].sort((a, b) => b - a);
    result.push(
      ...points.flatMap((points) =>
        rankTied([...teams.values()].filter((row) => row.points === points)),
      ),
    );
  }
  return result;
};
