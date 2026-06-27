import { notFound } from "next/navigation";
import { MatchDetailView } from "@/features/football/components/match-detail-view";
import {
  findMatchById,
  getVisibleCompetitions,
} from "@/features/football/view-utils";
import { getHomePageData } from "@/features/home/server/get-home-page-data";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const [{ matchId }, data] = await Promise.all([params, getHomePageData({})]);
  const item = findMatchById(getVisibleCompetitions(data), matchId);

  if (!item) notFound();

  return <MatchDetailView item={item} />;
}
