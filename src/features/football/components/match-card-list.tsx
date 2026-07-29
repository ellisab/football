import type { LeagueKey } from "@footballleagues/core/leagues";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import { SculptedMatch } from "./sculpted-match";

export type MatchCardItem = {
  competitionId: LeagueKey;
  competitionLabel: string;
  match: ApiMatch;
  roundLabel: string;
};

function MatchCard({
  compact = false,
  item,
  showCompetition = true,
}: {
  compact?: boolean;
  item: MatchCardItem;
  showCompetition?: boolean;
}) {
  return (
    <SculptedMatch
      compact={compact}
      competitionId={item.competitionId}
      competitionLabel={item.competitionLabel}
      href={item.match.matchID ? `/matches/${item.match.matchID}` : undefined}
      match={item.match}
      roundLabel={item.roundLabel}
      showCompetition={showCompetition}
    />
  );
}

export function MatchCardList({
  compact = false,
  matches,
  showCompetition = true,
}: {
  compact?: boolean;
  matches: MatchCardItem[];
  showCompetition?: boolean;
}) {
  return (
    <div className="match-list match-list--sculpted">
      {matches.map((item) => (
        <MatchCard
          compact={compact}
          item={item}
          key={`${item.competitionId}-${item.match.matchID ?? item.match.matchDateTimeUTC}-${item.match.team1?.teamName}`}
          showCompetition={showCompetition}
        />
      ))}
    </div>
  );
}
