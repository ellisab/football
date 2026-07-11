import { redirect } from "next/navigation";
import { getHomePageData } from "@/features/home/server/get-home-page-data";
import { TodayView } from "@/features/today/components/today-view";
import { resolveDateQuery } from "@/features/football/components/date-navigator";
import { getCompetitionMeta } from "@/features/football/competition-meta";
import { isLeagueKey } from "@footballleagues/core/leagues";

export const dynamic = "force-dynamic";

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

  return <TodayView data={data} dateKey={resolveDateQuery(params.date)} />;
}
