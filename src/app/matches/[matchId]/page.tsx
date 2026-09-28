import { sortMatchesByKickoff } from "@footballleagues/core/matches";
import {
  type ApiMatch,
  getMatchById,
  getMatchesByGroup,
} from "@footballleagues/core/openligadb";
import { notFound } from "next/navigation";
import { MatchDetailView } from "@/features/football/components/match-detail-view";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  if (!/^[1-9]\d*$/.test(matchId)) notFound();
  const match = await getMatchById(Number(matchId));
  if (!match) notFound();

  let contextMatches: ApiMatch[] = [];
  if (
    match.leagueShortcut &&
    match.leagueSeason &&
    match.group?.groupOrderID !== undefined
  ) {
    try {
      contextMatches = await getMatchesByGroup(
        match.leagueShortcut,
        match.leagueSeason,
        match.group.groupOrderID,
      );
    } catch {
      // Adjacent links are optional; a context outage must not hide the match.
    }
  }
  const orderedMatches = sortMatchesByKickoff([
    ...new Map(
      contextMatches
        .filter((item) => item.matchID && item.matchID !== match.matchID)
        .map((item) => [item.matchID, item]),
    ).values(),
    match,
  ]);
  const index = orderedMatches.findIndex(
    (item) => item.matchID === match.matchID,
  );
  return (
    <MatchDetailView
      match={match}
      previousMatch={orderedMatches[index - 1]}
      nextMatch={orderedMatches[index + 1]}
    />
  );
}
