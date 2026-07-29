import type { Metadata } from "next";
import { connection } from "next/server";
import {
  type FavoriteMatchItem,
  FavoritesView,
} from "@/features/favorites/favorites-view";
import { getCompetitionMeta } from "@/features/football/competition-meta";
import {
  getAllCompetitionMatches,
  getTeamId,
  getVisibleCompetitions,
} from "@/features/football/view-utils";
import { getHomePageData } from "@/features/home/server/get-home-page-data";
import { buildSearchItems } from "@/features/search/search-page";

export const metadata: Metadata = {
  title: "Favoriten",
  description: "Deine lokal gespeicherten Teams und Wettbewerbe.",
};

export default async function FavoritesPage() {
  await connection();
  const data = await getHomePageData({});
  const searchItems = buildSearchItems(data);
  const competitions = searchItems.filter(
    (item) => item.kind === "competition",
  );
  const teams = searchItems.filter((item) => item.kind === "team");
  const matches: FavoriteMatchItem[] = getAllCompetitionMatches(
    getVisibleCompetitions(data),
  )
    .filter((item) => item.match.matchID)
    .map((item) => {
      const meta = getCompetitionMeta(item.competition.resolvedLeague);

      return {
        competitionId: item.competition.resolvedLeague,
        competitionLabel: meta.label,
        match: item.match,
        roundLabel:
          item.match.group?.groupName ??
          `Saison ${item.competition.resolvedSeason}`,
        teamIds: [getTeamId(item.match.team1), getTeamId(item.match.team2)],
      };
    });

  return (
    <FavoritesView
      competitions={competitions}
      matches={matches}
      teams={teams}
    />
  );
}
