import { notFound } from "next/navigation";
import { MatchDetailView } from "@/features/football/components/match-detail-view";
import {
  findMatchById,
  getCompetitionMatches,
  getMatchTime,
  getVisibleCompetitions,
} from "@/features/football/view-utils";
import { getHomePageData } from "@/features/home/server/get-home-page-data";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const data = await getHomePageData({});
  const item = findMatchById(getVisibleCompetitions(data), matchId);
  if (!item) notFound();

  const { competition, match } = item;

  const contextMatches = competition
    ? getCompetitionMatches(competition)
        .filter((candidate) => candidate.matchID)
        .sort((a, b) => getMatchTime(a) - getMatchTime(b))
    : [];
  const contextIndex = contextMatches.findIndex(
    (candidate) => String(candidate.matchID) === matchId,
  );

  return (
    <MatchDetailView
      competition={competition}
      match={match}
      previousMatch={
        contextIndex > 0 ? contextMatches[contextIndex - 1] : undefined
      }
      nextMatch={
        contextIndex >= 0 && contextIndex < contextMatches.length - 1
          ? contextMatches[contextIndex + 1]
          : undefined
      }
    />
  );
}
