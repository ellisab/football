import { TeamsView } from "@/features/football/components/teams-view";
import {
  collectTeams,
  getVisibleCompetitions,
} from "@/features/football/view-utils";
import { getHomePageData } from "@/features/home/server/get-home-page-data";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const data = await getHomePageData({});
  const teams = collectTeams(getVisibleCompetitions(data));

  return <TeamsView teams={teams} />;
}
