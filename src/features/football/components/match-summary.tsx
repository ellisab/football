import { getCompetitionMeta } from "@/features/football/competition-meta";
import type { CompetitionMatch } from "@/features/football/view-utils";
import { type MatchCardItem, MatchCardList } from "./match-card-list";

const toMatchCardItem = ({
  competition,
  match,
}: CompetitionMatch): MatchCardItem => {
  const meta = getCompetitionMeta(competition.resolvedLeague);

  return {
    competitionId: competition.resolvedLeague,
    competitionLabel: meta.label,
    match,
    roundLabel:
      match.group?.groupName ?? `Saison ${competition.resolvedSeason}`,
  };
};

export function MatchList({
  compact = false,
  matches,
  showCompetition = true,
}: {
  compact?: boolean;
  matches: CompetitionMatch[];
  showCompetition?: boolean;
}) {
  return (
    <MatchCardList
      compact={compact}
      matches={matches.map(toMatchCardItem)}
      showCompetition={showCompetition}
    />
  );
}
