import { getHomePageData } from "@/features/home/server/get-home-page-data";
import { HomeView } from "@/features/home/components/home-view";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ league?: string; season?: string }>;
}) {
  const params = await searchParams;
  const data = await getHomePageData(params);

  return <HomeView data={data} />;
}
