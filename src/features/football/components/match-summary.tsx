import Link from "next/link";
import { Radio, Timer } from "lucide-react";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import { TeamBadge } from "@/features/teams/components/team-badge";
import type { CompetitionMatch } from "@/features/football/view-utils";
import {
  formatMatchTime,
  getMatchScore,
  getMatchScreenReaderLabel,
  getMatchStatus,
  getMatchStatusLabel,
  getTeamLabel,
} from "@/features/football/view-utils";
import { getCompetitionMeta } from "@/features/football/competition-meta";

const statusClassNames = {
  finished: "status-badge status-finished",
  live: "status-badge status-live",
  unknown: "status-badge status-unknown",
  upcoming: "status-badge status-upcoming",
} as const;

function TeamLine({
  score,
  team,
}: {
  score: string;
  team: ApiMatch["team1"];
}) {
  const name = getTeamLabel(team, "Noch offen");

  return (
    <div className="match-team-line">
      <TeamBadge
        name={name}
        iconUrl={team?.teamIconUrl}
        size={30}
        decorative
        className="team-badge-surface"
      />
      <span className="match-team-name">{name}</span>
      <span className="match-score-number" aria-hidden="true">
        {score}
      </span>
    </div>
  );
}

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
  const status = getMatchStatus(match);
  const score = getMatchScore(match).split(":");
  const meta = getCompetitionMeta(competition.resolvedLeague);
  const content = (
    <>
      <div className="match-time-column" aria-hidden="true">
        <span className="match-time">{formatMatchTime(match)}</span>
        <span className={statusClassNames[status]}>
          {status === "live" ? (
            <Radio className="h-3 w-3" />
          ) : (
            <Timer className="h-3 w-3" />
          )}
          {getMatchStatusLabel(match)}
        </span>
      </div>
      <div className="min-w-0">
        {showCompetition ? (
          <div className="match-competition-line">
            <span>{meta.shortLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">
              {match.group?.groupName ?? `Saison ${competition.resolvedSeason}`}
            </span>
          </div>
        ) : (
          <div className="match-competition-line">
            <span>{match.group?.groupName ?? `Saison ${competition.resolvedSeason}`}</span>
          </div>
        )}
        <div className="mt-2 grid gap-1.5">
          <TeamLine team={match.team1} score={score[0] ?? "-"} />
          <TeamLine team={match.team2} score={score[1] ?? "-"} />
        </div>
      </div>
    </>
  );
  const className = `match-summary ${compact ? "match-summary-compact" : ""}`;
  const label = getMatchScreenReaderLabel(match);

  if (match.matchID) {
    return (
      <Link href={`/matches/${match.matchID}`} className={className} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <article className={className} aria-label={label}>
      {content}
    </article>
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
    <div className="match-list">
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
