import { notFound } from "next/navigation";
import { HomeView } from "@/features/home/components/home-view";
import { getLeagueKeyFromSlug } from "@/features/football/competition-meta";
import { getHomePageData } from "@/features/home/server/get-home-page-data";

export default async function CompetitionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);

  if (slug === "men") {
    const data = await getHomePageData({ league: "bl1", season: query.season });
    return <HomeView data={data} />;
  }

  const league = getLeagueKeyFromSlug(slug);
  if (!league) notFound();

  const data = await getHomePageData({
    league,
    season: query.season,
  });

  return <HomeView data={data} />;
}
