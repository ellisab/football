import { TablesView } from "@/features/football/components/tables-view";
import { getVisibleCompetitions } from "@/features/football/view-utils";
import { getHomePageData } from "@/features/home/server/get-home-page-data";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
  const data = await getHomePageData({});

  return <TablesView competitions={getVisibleCompetitions(data)} />;
}
