import Link from "next/link";
import { CalendarDays, Goal, MapPin, Trophy } from "lucide-react";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import { TeamBadge } from "@/features/teams/components/team-badge";
import type { WebCompetitionViewModel } from "@/features/home/presenter/home-view-model";
import {
  formatMatchTime,
  getMatchScore,
  getMatchStatus,
  getMatchStatusLabel,
  getTeamId,
  getTeamLabel,
  getVenueLabel,
} from "@/features/football/view-utils";
import { getCompetitionMeta } from "@/features/football/competition-meta";
import { FavoriteButton } from "@/features/favorites";

const fullDateFormatter = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Europe/Berlin",
});

const getFullKickoff = (match: ApiMatch) => {
  const value = match.matchDateTimeUTC ?? match.matchDateTime;
  if (!value) return "Anstoß noch offen";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Anstoß noch offen"
    : `${fullDateFormatter.format(date)} Uhr`;
};

function TeamBlock({ team }: { team: ApiMatch["team1"] }) {
  const name = getTeamLabel(team, "Noch offen");
  const teamId = getTeamId(team);
  const identity = (
    <>
      <TeamBadge
        name={name}
        iconUrl={team?.teamIconUrl}
        size={72}
        decorative
        className="team-badge-surface"
      />
      <span>{name}</span>
    </>
  );

  return (
    <div className="match-detail-team">
      {team ? (
        <Link href={`/teams/${teamId}`} className="match-detail-team-link">
          {identity}
        </Link>
      ) : (
        <div className="match-detail-team-link">{identity}</div>
      )}
      {team ? (
        <FavoriteButton
          kind="team"
          id={teamId}
          label={name}
          showLabel={false}
          className="favorite-icon-button"
        />
      ) : null}
    </div>
  );
}

export function MatchDetailView({
  competition,
  match,
  nextMatch,
  previousMatch,
}: {
  competition?: WebCompetitionViewModel;
  match: ApiMatch;
  nextMatch?: ApiMatch;
  previousMatch?: ApiMatch;
}) {
  const status = getMatchStatus(match);
  const score = getMatchScore(match);
  const venue = getVenueLabel(match);
  const meta = competition ? getCompetitionMeta(competition.resolvedLeague) : undefined;
  const competitionName = meta?.label ?? match.leagueName ?? "Wettbewerb";
  const competitionHref = meta
    ? `${meta.href}?season=${competition?.resolvedSeason ?? match.leagueSeason ?? ""}`
    : undefined;
  const periodResults = [...(match.matchResults ?? [])].sort(
    (a, b) => (a.resultOrderID ?? 0) - (b.resultOrderID ?? 0)
  );
  const goals = [...(match.goals ?? [])].sort(
    (a, b) => (a.matchMinute ?? 0) - (b.matchMinute ?? 0)
  );

  return (
    <div className="page-shell">
      <div className="content-column">
        <header className="match-detail-header">
          <div className="match-detail-context">
            {competitionHref ? (
              <Link href={competitionHref}>
                <Trophy aria-hidden="true" className="h-4 w-4" />
                {competitionName}
              </Link>
            ) : (
              <span>
                <Trophy aria-hidden="true" className="h-4 w-4" />
                {competitionName}
              </span>
            )}
            <span className={`status-badge status-${status}`}>
              {getMatchStatusLabel(match)}
            </span>
          </div>
          <h1 className="sr-only">
            {getTeamLabel(match.team1, "Heimteam")} gegen {getTeamLabel(match.team2, "Auswärtsteam")}
          </h1>
          <div className="match-scoreboard">
            <TeamBlock team={match.team1} />
            <div className="match-detail-score">
              <strong>{score}</strong>
              <span>{status === "upcoming" ? formatMatchTime(match) : getMatchStatusLabel(match)}</span>
            </div>
            <TeamBlock team={match.team2} />
          </div>
          <div className="match-detail-meta">
            <span>
              <CalendarDays aria-hidden="true" className="h-4 w-4" />
              {getFullKickoff(match)}
            </span>
            <span>
              <Trophy aria-hidden="true" className="h-4 w-4" />
              {match.group?.groupName ?? "Runde noch offen"}
            </span>
            <span>
              <MapPin aria-hidden="true" className="h-4 w-4" />
              {venue ?? "Spielort noch offen"}
            </span>
          </div>
        </header>

        <div className="match-detail-grid">
          <section className="content-section">
            <div className="section-heading-row">
              <div>
                <h2 className="section-title">Tore</h2>
                <p className="section-description">Vom Datenfeed bestätigte Torereignisse.</p>
              </div>
            </div>
            {goals.length > 0 ? (
              <ol className="event-list">
                {goals.map((goal, index) => (
                  <li key={goal.goalID ?? `${goal.goalGetterName}-${index}`}>
                    <span className="event-minute">{goal.matchMinute ?? "–"}&apos;</span>
                    <Goal aria-hidden="true" className="h-4 w-4" />
                    <span className="min-w-0 flex-1">
                      <strong>{goal.goalGetterName ?? "Torschütze nicht angegeben"}</strong>
                      <small>
                        {goal.isPenalty ? "Elfmeter" : "Tor"}
                        {goal.isOwnGoal ? " · Eigentor" : ""}
                        {goal.isOvertime ? " · Verlängerung" : ""}
                      </small>
                    </span>
                    <span className="event-score">
                      {goal.scoreTeam1 ?? "–"}:{goal.scoreTeam2 ?? "–"}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="inline-empty">
                {status === "upcoming"
                  ? "Ereignisse erscheinen nach dem Anstoß, sobald der Feed sie liefert."
                  : "Für dieses Spiel sind keine Torereignisse verfügbar."}
              </p>
            )}
          </section>

          <aside className="content-section">
            <div className="section-heading-row">
              <div>
                <h2 className="section-title">Ergebnisphasen</h2>
                <p className="section-description">Zwischen- und Endstände aus der Quelle.</p>
              </div>
            </div>
            {periodResults.length > 0 ? (
              <dl className="result-phase-list">
                {periodResults.map((result, index) => (
                  <div key={result.resultID ?? `${result.resultName}-${index}`}>
                    <dt>{result.resultName ?? result.resultDescription ?? "Ergebnis"}</dt>
                    <dd>
                      {result.pointsTeam1 ?? "–"}:{result.pointsTeam2 ?? "–"}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="inline-empty">Noch keine Ergebnisphasen verfügbar.</p>
            )}
          </aside>
        </div>

        {previousMatch || nextMatch ? (
          <nav
            className={`adjacent-match-nav ${!previousMatch || !nextMatch ? "adjacent-match-nav-single" : ""}`}
            aria-label="Benachbarte Spiele"
          >
            {previousMatch?.matchID ? (
              <Link href={`/matches/${previousMatch.matchID}`}>
                <small>Vorheriges Spiel</small>
                <strong>
                  {getTeamLabel(previousMatch.team1, "Offen")} gegen {getTeamLabel(previousMatch.team2, "Offen")}
                </strong>
              </Link>
            ) : null}
            {nextMatch?.matchID ? (
              <Link href={`/matches/${nextMatch.matchID}`}>
                <small>Nächstes Spiel</small>
                <strong>
                  {getTeamLabel(nextMatch.team1, "Offen")} gegen {getTeamLabel(nextMatch.team2, "Offen")}
                </strong>
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
