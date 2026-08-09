import { isLeagueKey } from "@footballleagues/core/leagues";
import { redirect } from "next/navigation";
import { getCompetitionMeta } from "@/features/football/competition-meta";
import { resolveDateQuery } from "@/features/football/components/date-navigator";
import {
  getTodayCompetitionMatches,
  getVisibleCompetitions,
} from "@/features/football/view-utils";
import { getHomePageData } from "@/features/home/server/get-home-page-data";
import { TodayView } from "@/features/today/components/today-view";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    group?: string;
    league?: string;
    season?: string;
  }>;
}) {
  const params = await searchParams;

  if (params.league && isLeagueKey(params.league)) {
    const meta = getCompetitionMeta(params.league);
    const query = new URLSearchParams();
    if (params.season) query.set("season", params.season);
    if (params.group) query.set("matchday", params.group);
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    redirect(`${meta.href}${suffix}`);
  }

  const data = await getHomePageData({});
  const dateKey = resolveDateQuery(params.date);
  const matches = getTodayCompetitionMatches({
    competitions: getVisibleCompetitions(data),
    date: new Date(`${dateKey}T12:00:00.000Z`),
  });

  return <TodayView data={data} dateKey={dateKey} matches={matches} />;
}
