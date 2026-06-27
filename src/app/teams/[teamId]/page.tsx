import { notFound } from "next/navigation";
import { TeamDetailView } from "@/features/football/components/teams-view";
import {
  collectTeams,
  getVisibleCompetitions,
} from "@/features/football/view-utils";
import { getHomePageData } from "@/features/home/server/get-home-page-data";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const [{ teamId }, data] = await Promise.all([params, getHomePageData({})]);
  const team = collectTeams(getVisibleCompetitions(data)).find(
    (entry) => entry.id === teamId
  );

  if (!team) notFound();

  return <TeamDetailView team={team} />;
}
