import Link from "next/link";
import { CalendarDays, Goal, MapPin, Trophy } from "lucide-react";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import type { WebCompetitionViewModel } from "@/features/home/presenter/home-view-model";
import {
  getMatchStatus,
  getTeamId,
  getTeamLabel,
  getVenueLabel,
} from "@/features/football/view-utils";
import { getCompetitionMeta } from "@/features/football/competition-meta";
import { FavoriteButton } from "@/features/favorites";
import { SculptedMatch } from "@/features/football/components/sculpted-match";

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

function TeamAction({ team }: { team: ApiMatch["team1"] }) {
  if (!team) return null;

  const name = getTeamLabel(team, "Noch offen");
  const teamId = getTeamId(team);

  return (
    <div className="match-detail-team-action">
      <Link href={`/teams/${teamId}`} className="match-detail-team-link">
        {name}
      </Link>
      <FavoriteButton
        kind="team"
        id={teamId}
        label={name}
        showLabel={false}
        className="favorite-icon-button"
      />
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
  const venue = getVenueLabel(match);
  const meta = competition ? getCompetitionMeta(competition.resolvedLeague) : undefined;
  const competitionName = meta?.label ?? match.leagueName ?? "Wettbewerb";
  const season = competition?.resolvedSeason ?? match.leagueSeason;
  const roundLabel =
    match.group?.groupName ?? (season ? `Saison ${season}` : "Runde noch offen");
  const competitionHref = meta
    ? season
      ? `${meta.href}?season=${season}`
      : meta.href
    : undefined;
  const periodResults = [...(match.matchResults ?? [])].sort(
    (a, b) => (a.resultOrderID ?? 0) - (b.resultOrderID ?? 0)
  );
  const goals = [...(match.goals ?? [])].sort(
    (a, b) => (a.matchMinute ?? 0) - (b.matchMinute ?? 0)
  );

  return (
    <div className="page-shell match-detail-page">
      <div className="content-column">
        <section className="match-detail-hero">
          <h1 className="sr-only">
            {getTeamLabel(match.team1, "Heimteam")} gegen {getTeamLabel(match.team2, "Auswärtsteam")}
          </h1>
          <SculptedMatch
            competitionLabel={competitionName}
            match={match}
            roundLabel={roundLabel}
          />
          <div className="match-detail-support">
            <div className="match-detail-meta">
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
              <span>
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
                {getFullKickoff(match)}
              </span>
              <span>
                <Trophy aria-hidden="true" className="h-4 w-4" />
                {roundLabel}
              </span>
              <span>
                <MapPin aria-hidden="true" className="h-4 w-4" />
                {venue ?? "Spielort noch offen"}
              </span>
            </div>
            {match.team1 || match.team2 ? (
              <nav className="match-detail-team-actions" aria-label="Teams und Favoriten">
                <TeamAction team={match.team1} />
                <TeamAction team={match.team2} />
              </nav>
            ) : null}
          </div>
        </section>

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
