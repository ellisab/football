import { HomeView } from "@/features/home/components/home-view";
import { getHomePageData } from "@/features/home/server/get-home-page-data";

export default async function TodayPage() {
  const data = await getHomePageData({});

  return <HomeView data={data} />;
}
