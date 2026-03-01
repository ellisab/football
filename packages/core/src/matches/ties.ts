import { getFinalResult, type ApiMatch, type ApiTeam } from "../openligadb";

type TieTeam = Pick<ApiTeam, "teamId" | "teamName" | "teamIconUrl">;

export type KnockoutTie = {
  key: string;
  team1: TieTeam;
  team2: TieTeam;
  matches: ApiMatch[];
  aggregateScore?: {
    team1: number;
    team2: number;
    countedLegs: number;
    totalLegs: number;
    leader: "team1" | "team2" | null;
  };
};

type TieAccumulator = {
  key: string;
  team1Identity: string;
  team2Identity: string;
  teamByIdentity: Map<string, TieTeam>;
  matches: ApiMatch[];
};

type AggregateLeader = "team1" | "team2" | null;

const getMatchTime = (match: ApiMatch) => {
  const timestamp = Date.parse(match.matchDateTimeUTC ?? match.matchDateTime ?? "");
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

const toTeamIdentity = (
  team: ApiTeam | undefined,
  match: ApiMatch,
  side: "home" | "away"
) => {
  if (typeof team?.teamId === "number") {
    return `id:${team.teamId}`;
  }

  const normalizedName = team?.teamName?.trim().toLowerCase();
  if (normalizedName) {
    return `name:${normalizedName}`;
  }

  const matchKey =
    match.matchID?.toString() ??
    `${match.matchDateTimeUTC ?? match.matchDateTime ?? "unknown"}-${side}`;

  return `unknown:${matchKey}:${side}`;
};

const createTieTeam = (team: ApiTeam | undefined, fallback: string): TieTeam => ({
  teamId: team?.teamId,
  teamName: team?.teamName ?? fallback,
  teamIconUrl: team?.teamIconUrl,
});

const compareMatches = (a: ApiMatch, b: ApiMatch) => {
  const byTime = getMatchTime(a) - getMatchTime(b);
  if (byTime !== 0) return byTime;

  return (a.matchID ?? 0) - (b.matchID ?? 0);
};

const toAggregateScore = (
  matches: ApiMatch[],
  team1Identity: string,
  team2Identity: string
) => {
  let team1 = 0;
  let team2 = 0;
  let countedLegs = 0;

  for (const match of matches) {
    const finalResult = getFinalResult(match);
    if (!finalResult) continue;

    const homeIdentity = toTeamIdentity(match.team1, match, "home");
    const awayIdentity = toTeamIdentity(match.team2, match, "away");
    const homeScore = finalResult.pointsTeam1 ?? 0;
    const awayScore = finalResult.pointsTeam2 ?? 0;

    if (homeIdentity === team1Identity && awayIdentity === team2Identity) {
      team1 += homeScore;
      team2 += awayScore;
      countedLegs += 1;
      continue;
    }

    if (homeIdentity === team2Identity && awayIdentity === team1Identity) {
      team1 += awayScore;
      team2 += homeScore;
      countedLegs += 1;
    }
  }

  if (countedLegs === 0) return undefined;

  const leader: AggregateLeader =
    team1 > team2 ? "team1" : team2 > team1 ? "team2" : null;

  return {
    team1,
    team2,
    countedLegs,
    totalLegs: matches.length,
    leader,
  };
};

export const groupKnockoutMatchesByTie = (matches: ApiMatch[]): KnockoutTie[] => {
  const ties = new Map<string, TieAccumulator>();

  for (const match of matches) {
    const homeIdentity = toTeamIdentity(match.team1, match, "home");
    const awayIdentity = toTeamIdentity(match.team2, match, "away");

    const [team1Identity, team2Identity] =
      homeIdentity < awayIdentity
        ? [homeIdentity, awayIdentity]
        : [awayIdentity, homeIdentity];

    const tieKey = `${team1Identity}__${team2Identity}`;
    const existing = ties.get(tieKey);

    if (existing) {
      existing.matches.push(match);
      if (!existing.teamByIdentity.has(homeIdentity)) {
        existing.teamByIdentity.set(homeIdentity, createTieTeam(match.team1, "Home"));
      }
      if (!existing.teamByIdentity.has(awayIdentity)) {
        existing.teamByIdentity.set(awayIdentity, createTieTeam(match.team2, "Away"));
      }
      continue;
    }

    ties.set(tieKey, {
      key: tieKey,
      team1Identity,
      team2Identity,
      teamByIdentity: new Map<string, TieTeam>([
        [homeIdentity, createTieTeam(match.team1, "Home")],
        [awayIdentity, createTieTeam(match.team2, "Away")],
      ]),
      matches: [match],
    });
  }

  return Array.from(ties.values())
    .map((tie) => {
      const sortedMatches = [...tie.matches].sort(compareMatches);
      const firstMatch = sortedMatches[0];
      const fallbackTeam1 = createTieTeam(firstMatch?.team1, "Team 1");
      const fallbackTeam2 = createTieTeam(firstMatch?.team2, "Team 2");

      const team1 = tie.teamByIdentity.get(tie.team1Identity) ?? fallbackTeam1;
      const team2 = tie.teamByIdentity.get(tie.team2Identity) ?? fallbackTeam2;

      return {
        key: tie.key,
        team1,
        team2,
        matches: sortedMatches,
        aggregateScore: toAggregateScore(
          sortedMatches,
          tie.team1Identity,
          tie.team2Identity
        ),
      };
    })
    .sort((a, b) => compareMatches(a.matches[0] as ApiMatch, b.matches[0] as ApiMatch));
};
