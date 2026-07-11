import { notFound } from "next/navigation";
import {
  getMatchById,
  OPENLIGADB_CACHE_SECONDS,
} from "@footballleagues/core/openligadb";
import { MatchDetailView } from "@/features/football/components/match-detail-view";
import {
  findMatchById,
  getCompetitionMatches,
  getMatchTime,
  resolveCompetitionLeagueForMatch,
  getVisibleCompetitions,
} from "@/features/football/view-utils";
import { getHomePageData } from "@/features/home/server/get-home-page-data";

const getFreshMatch = async (matchId: string) => {
  const parsedMatchId = Number.parseInt(matchId, 10);
  if (!Number.isInteger(parsedMatchId) || parsedMatchId <= 0) return undefined;

  try {
    return await getMatchById(parsedMatchId, {
      next: { revalidate: OPENLIGADB_CACHE_SECONDS.liveMatchday },
    });
  } catch {
    return undefined;
  }
};

export default async function MatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const [data, freshMatch] = await Promise.all([
    getHomePageData({}),
    getFreshMatch(matchId),
  ]);
  const item = findMatchById(getVisibleCompetitions(data), matchId);

  if (!item && !freshMatch) notFound();

  const match =
    freshMatch && String(freshMatch.matchID) === matchId
      ? freshMatch
      : item?.match;
  if (!match) notFound();
  const competition =
    item?.competition ??
    getVisibleCompetitions(data).find(
      (candidate) =>
        candidate.resolvedLeague === resolveCompetitionLeagueForMatch(match)
    );
  const contextMatches = competition
    ? getCompetitionMatches(competition)
        .filter((candidate) => candidate.matchID)
        .sort((a, b) => getMatchTime(a) - getMatchTime(b))
    : [];
  const contextIndex = contextMatches.findIndex(
    (candidate) => String(candidate.matchID) === matchId
  );

  return (
    <MatchDetailView
      competition={competition}
      match={match}
      previousMatch={contextIndex > 0 ? contextMatches[contextIndex - 1] : undefined}
      nextMatch={
        contextIndex >= 0 && contextIndex < contextMatches.length - 1
          ? contextMatches[contextIndex + 1]
          : undefined
      }
    />
  );
}
