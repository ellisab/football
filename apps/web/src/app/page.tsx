import { HomeView } from "@/features/matchday/views/home-view";
import { getHomeData } from "@/features/matchday/server/get-home-data";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ league?: string; season?: string }>;
}) {
  const params = await searchParams;
  const data = await getHomeData(params);

  return <HomeView data={data} />;
}
