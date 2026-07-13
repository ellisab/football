import Link from "next/link";
import { Radio } from "lucide-react";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import { TeamBadge } from "@/features/teams/components/team-badge";
import {
  formatMatchTime,
  getMatchScore,
  getMatchScreenReaderLabel,
  getMatchStatus,
  getMatchStatusLabel,
  getTeamLabel,
} from "@/features/football/view-utils";

const centerLabel = (match: ApiMatch) => {
  const status = getMatchStatus(match);

  if (status === "live") return "LIVE";
  if (status === "finished") return "ENDE";
  if (status === "upcoming") return formatMatchTime(match);
  return "OFFEN";
};

function SculptedTeam({
  align,
  name,
  iconUrl,
  score,
}: {
  align: "left" | "right";
  name: string;
  iconUrl?: string;
  score: string;
}) {
  return (
    <div className="featured-match__team" data-align={align}>
      <TeamBadge
        name={name}
        iconUrl={iconUrl}
        size={56}
        decorative
        className="featured-match__badge"
        textClassName="featured-match__badge-text"
      />
      <span className="featured-match__team-name">{name}</span>
      <strong className="featured-match__score" aria-hidden="true">
        {score}
      </strong>
    </div>
  );
}

export function SculptedMatch({
  compact = false,
  competitionLabel,
  href,
  match,
  roundLabel,
  showCompetition = true,
}: {
  compact?: boolean;
  competitionLabel: string;
  href?: string;
  match: ApiMatch;
  roundLabel: string;
  showCompetition?: boolean;
}) {
  const status = getMatchStatus(match);
  const score = getMatchScore(match).split(":");
  const team1 = getTeamLabel(match.team1, "Team offen");
  const team2 = getTeamLabel(match.team2, "Team offen");
  const body = (
    <>
      <div className="featured-match__meta">
        {showCompetition ? (
          <>
            <span>{competitionLabel}</span>
            <span aria-hidden="true">·</span>
          </>
        ) : null}
        <span>{roundLabel}</span>
      </div>
      <div className="featured-match__board">
        <SculptedTeam
          align="left"
          name={team1}
          iconUrl={match.team1?.teamIconUrl}
          score={score[0] ?? "–"}
        />
        <div className="featured-match__signal" data-status={status} aria-hidden="true">
          {status === "live" ? <Radio className="featured-match__live-icon" /> : null}
          <strong>{centerLabel(match)}</strong>
          <span>{getMatchStatusLabel(match)}</span>
        </div>
        <SculptedTeam
          align="right"
          name={team2}
          iconUrl={match.team2?.teamIconUrl}
          score={score[1] ?? "–"}
        />
      </div>
      {href ? (
        <span className="featured-match__affordance" aria-hidden="true">
          Spiel öffnen
        </span>
      ) : null}
    </>
  );
  const label = `Spiel: ${getMatchScreenReaderLabel(match)}`;
  const className = `featured-match${href ? " focus-ring" : ""}${
    compact ? " featured-match--compact" : ""
  }`;

  if (href) {
    return (
      <Link href={href} className={className} aria-label={label}>
        {body}
      </Link>
    );
  }

  return (
    <article className={className} aria-label={label}>
      {body}
    </article>
  );
}
