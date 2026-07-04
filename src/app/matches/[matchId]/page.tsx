import { notFound } from "next/navigation";
import {
  getMatchById,
  OPENLIGADB_CACHE_SECONDS,
} from "@footballleagues/core/openligadb";
import { MatchDetailView } from "@/features/football/components/match-detail-view";
import {
  findMatchById,
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

  if (!item) notFound();

  return (
    <MatchDetailView
      item={{
        ...item,
        match:
          freshMatch && String(freshMatch.matchID) === matchId
            ? freshMatch
            : item.match,
      }}
    />
  );
}
