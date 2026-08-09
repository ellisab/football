import type { Metadata } from "next";
import { resolveDateQuery } from "@/features/football/components/date-navigator";
import {
  getTodayCompetitionMatches,
  getVisibleCompetitions,
} from "@/features/football/view-utils";
import { getHomePageData } from "@/features/home/server/get-home-page-data";
import { TodayView } from "@/features/today/components/today-view";

export const metadata: Metadata = {
  title: "Heute",
  description: "Heutige Fußballspiele, Anstoßzeiten und Ergebnisse.",
};

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const dateKey = resolveDateQuery(params.date);
  const data = await getHomePageData({});
  const matches = getTodayCompetitionMatches({
    competitions: getVisibleCompetitions(data),
    date: new Date(`${dateKey}T12:00:00.000Z`),
  });

  return <TodayView data={data} dateKey={dateKey} matches={matches} />;
}
