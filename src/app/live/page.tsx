import type { Metadata } from "next";
import { connection } from "next/server";
import { LiveView } from "@/features/live/components/live-view";
import { getHomePageData } from "@/features/home/server/get-home-page-data";
import {
  getAllCompetitionMatches,
  getVisibleCompetitions,
} from "@/features/football/view-utils";
import { refreshUncertainMatches } from "@/features/football/server/refresh-uncertain-matches";

export const metadata: Metadata = {
  title: "Live",
  description: "Möglicherweise laufende Fußballspiele und die nächsten Anstoßzeiten.",
};

export default async function LivePage() {
  await connection();
  const data = await getHomePageData({});
  const cachedMatches = getAllCompetitionMatches(getVisibleCompetitions(data));
  const matches = await refreshUncertainMatches({ matches: cachedMatches });

  return <LiveView data={data} matches={matches} />;
}
