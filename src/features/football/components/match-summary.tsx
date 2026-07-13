import type { CompetitionMatch } from "@/features/football/view-utils";
import { getCompetitionMeta } from "@/features/football/competition-meta";
import { SculptedMatch } from "./sculpted-match";

export function MatchSummary({
  compact = false,
  item,
  showCompetition = true,
}: {
  compact?: boolean;
  item: CompetitionMatch;
  showCompetition?: boolean;
}) {
  const { competition, match } = item;
  const meta = getCompetitionMeta(competition.resolvedLeague);

  return (
    <SculptedMatch
      compact={compact}
      competitionLabel={meta.label}
      href={match.matchID ? `/matches/${match.matchID}` : undefined}
      match={match}
      roundLabel={match.group?.groupName ?? `Saison ${competition.resolvedSeason}`}
      showCompetition={showCompetition}
    />
  );
}

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
    <div className="match-list match-list--sculpted">
      {matches.map((item) => (
        <MatchSummary
          compact={compact}
          item={item}
          key={`${item.competition.resolvedLeague}-${item.match.matchID ?? item.match.matchDateTimeUTC}-${item.match.team1?.teamName}`}
          showCompetition={showCompetition}
        />
      ))}
    </div>
  );
}
