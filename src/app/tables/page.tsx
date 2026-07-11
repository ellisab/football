import type { Metadata } from "next";
import { TablesView } from "@/features/football/components/tables-view";
import { getVisibleCompetitions } from "@/features/football/view-utils";
import { getLeagueKeyFromSlug } from "@/features/football/competition-meta";
import { getHomePageData } from "@/features/home/server/get-home-page-data";

export const metadata: Metadata = {
  title: "Tabellen",
  description: "Tabellen der unterstützten Fußballwettbewerbe.",
};

export default async function TablesPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; season?: string }>;
}) {
  const query = await searchParams;
  const league = query.competition
    ? getLeagueKeyFromSlug(query.competition)
    : undefined;
  const data = await getHomePageData({
    league,
    season: query.season,
  });

  return <TablesView competitions={getVisibleCompetitions(data)} />;
}
