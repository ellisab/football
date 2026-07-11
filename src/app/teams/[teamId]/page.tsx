import { notFound } from "next/navigation";
import {
  getMatchesByTeamId,
  OPENLIGADB_CACHE_SECONDS,
} from "@footballleagues/core/openligadb";
import { TeamDetailView } from "@/features/football/components/teams-view";
import {
  collectTeams,
  getMatchIdentity,
  getMatchStatus,
  getMatchTime,
  getTeamId,
  getVisibleCompetitions,
  resolveCompetitionLeagueForMatch,
  type CompetitionMatch,
  type TeamSummary,
} from "@/features/football/view-utils";
import { getHomePageData } from "@/features/home/server/get-home-page-data";

const TEAM_MATCHES_TIMEOUT_MS = 4_000;

const getFreshTeamMatches = async (teamId: string) => {
  const parsed = Number.parseInt(teamId, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return [];

  try {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timeoutFallback = new Promise<never>((_, reject) => {
      timeout = setTimeout(
        () => reject(new Error("Team matches request timed out")),
        TEAM_MATCHES_TIMEOUT_MS
      );
    });
    return await Promise.race([
      getMatchesByTeamId(parsed, 8, 8, {
        next: { revalidate: OPENLIGADB_CACHE_SECONDS.liveMatchday },
      }),
      timeoutFallback,
    ]).finally(() => {
      if (timeout) clearTimeout(timeout);
    });
  } catch {
    return [];
  }
};

const dedupeMatches = (matches: CompetitionMatch[]) => {
  const seen = new Set<string>();
  return matches.filter((item) => {
    const key = `${item.competition.resolvedLeague}-${getMatchIdentity(item.match)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const [data, freshMatches] = await Promise.all([
    getHomePageData({}),
    getFreshTeamMatches(teamId),
  ]);
  const competitions = getVisibleCompetitions(data);
  const baseTeam = collectTeams(competitions).find(
    (entry) => entry.id === teamId
  );
  const mappedFreshMatches: CompetitionMatch[] = freshMatches.flatMap((match) => {
    const league = resolveCompetitionLeagueForMatch(match);
    const competition = competitions.find(
      (candidate) => candidate.resolvedLeague === league
    );
    return competition ? [{ competition, match }] : [];
  });
  const sourceTeam = freshMatches
    .flatMap((match) => [match.team1, match.team2])
    .find((team) => team && getTeamId(team) === teamId);

  if (!baseTeam && (!sourceTeam || mappedFreshMatches.length === 0)) notFound();

  const allKnownMatches = dedupeMatches([
    ...mappedFreshMatches,
    ...(baseTeam?.recentMatches ?? []),
    ...(baseTeam?.upcomingMatches ?? []),
  ]);
  const recentMatches = allKnownMatches
    .filter((item) => getMatchStatus(item.match) === "finished")
    .sort((a, b) => getMatchTime(b.match) - getMatchTime(a.match));
  const upcomingMatches = allKnownMatches
    .filter((item) => {
      const status = getMatchStatus(item.match);
      return status === "live" || status === "upcoming";
    })
    .sort((a, b) => getMatchTime(a.match) - getMatchTime(b.match));
  const team: TeamSummary = {
    competitions:
      baseTeam?.competitions ??
      Array.from(
        new Map(
          mappedFreshMatches.map(({ competition }) => [
            competition.resolvedLeague,
            {
              label: competition.leagueLabel,
              league: competition.resolvedLeague,
              season: competition.resolvedSeason,
            },
          ])
        ).values()
      ),
    iconUrl: baseTeam?.iconUrl ?? sourceTeam?.teamIconUrl,
    id: teamId,
    name: baseTeam?.name ?? sourceTeam?.teamName ?? sourceTeam?.shortName ?? "Team",
    nextMatch: upcomingMatches[0],
    recentMatch: recentMatches[0],
    recentMatches,
    tablePosition: baseTeam?.tablePosition,
    upcomingMatches,
  };

  return <TeamDetailView team={team} />;
}
