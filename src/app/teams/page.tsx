import { TeamsView } from "@/features/football/components/teams-view";
import {
  collectTeams,
  getVisibleCompetitions,
} from "@/features/football/view-utils";
import { getHomePageData } from "@/features/home/server/get-home-page-data";

export const metadata: Metadata = {
  title: "Teams",
  description: "Teams, nächste Spiele und Tabellenkontext.",
};

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = await searchParams;
  const data = await getHomePageData({});
  const teams = collectTeams(getVisibleCompetitions(data));

  return <TeamsView teams={teams} query={query.q?.trim() ?? ""} />;
}

import type { Metadata } from "next";
