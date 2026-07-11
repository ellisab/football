import type { Metadata } from "next";
import { connection } from "next/server";
import { FavoritesView, type FavoriteMatchItem } from "@/features/favorites/favorites-view";
import { buildSearchItems } from "@/features/search/search-page";
import {
  getAllCompetitionMatches,
  getMatchStatusLabel,
  getTeamId,
  getTeamLabel,
  getVisibleCompetitions,
} from "@/features/football/view-utils";
import { getHomePageData } from "@/features/home/server/get-home-page-data";

export const metadata: Metadata = {
  title: "Favoriten",
  description: "Deine lokal gespeicherten Teams und Wettbewerbe.",
};

export default async function FavoritesPage() {
  await connection();
  const data = await getHomePageData({});
  const searchItems = buildSearchItems(data);
  const competitions = searchItems.filter((item) => item.kind === "competition");
  const teams = searchItems.filter((item) => item.kind === "team");
  const matches: FavoriteMatchItem[] = getAllCompetitionMatches(
    getVisibleCompetitions(data)
  )
    .filter((item) => item.match.matchID)
    .map((item) => ({
      competitionId: item.competition.resolvedLeague,
      href: `/matches/${item.match.matchID}`,
      id: String(item.match.matchID),
      label: `${getTeamLabel(item.match.team1, "Offen")} gegen ${getTeamLabel(item.match.team2, "Offen")}`,
      status: getMatchStatusLabel(item.match),
      teamIds: [getTeamId(item.match.team1), getTeamId(item.match.team2)],
    }));

  return <FavoritesView competitions={competitions} matches={matches} teams={teams} />;
}
