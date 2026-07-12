import Link from "next/link";
import { ArrowRight, Shirt } from "lucide-react";
import { TeamBadge } from "@/features/teams/components/team-badge";
import type { TeamSummary } from "@/features/football/view-utils";
import { MatchSummary } from "@/features/football/components/match-summary";
import { EmptyState, PageIntro } from "@/features/football/components/product-ui";
import { SearchField } from "@/features/football/components/search-field";
import { getCompetitionMeta } from "@/features/football/competition-meta";
import { FavoriteButton } from "@/features/favorites";

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("de-DE")
    .trim();

function TeamCard({ team }: { team: TeamSummary }) {
  return (
    <article className="team-card">
      <div className="flex min-w-0 items-center gap-3">
        <TeamBadge
          name={team.name}
          iconUrl={team.iconUrl}
          size={44}
          decorative
          className="team-badge-surface shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-[var(--text)]">
            {team.name}
          </h2>
          <p className="mt-0.5 truncate text-sm text-[var(--text-muted)]">
            {team.competitions.map((entry) => entry.label).join(" · ")}
          </p>
        </div>
        <FavoriteButton
          kind="team"
          id={team.id}
          label={team.name}
          showLabel={false}
          className="favorite-icon-button"
        />
      </div>
      <div className="team-card-facts">
        <span>
          <strong>{team.tablePosition ? `#${team.tablePosition.position}` : "–"}</strong>
          Tabellenplatz
        </span>
        <span>
          <strong>{team.tablePosition?.points ?? "–"}</strong>
          Punkte
        </span>
        <span>
          <strong>{team.nextMatch ? "Geplant" : "–"}</strong>
          Nächstes Spiel
        </span>
      </div>
      <Link href={`/teams/${team.id}`} className="team-card-link">
        Team öffnen
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </article>
  );
}

export function TeamsView({
  query = "",
  teams,
}: {
  query?: string;
  teams: TeamSummary[];
}) {
  const normalizedQuery = normalize(query);
  const filtered = normalizedQuery
    ? teams.filter((team) => normalize(team.name).includes(normalizedQuery))
    : teams;

  return (
    <div className="page-shell">
      <div className="wide-column">
        <PageIntro
          eyebrow="Vereine & Nationalteams"
          title="Teams"
          description="Schneller Zugriff auf nächste Partien, letzte Ergebnisse und den verfügbaren Tabellenkontext."
        />
        <form action="/teams" method="get" className="mb-6" role="search">
          <SearchField
            inputId="team-query"
            name="q"
            defaultValue={query}
            placeholder="Teamname"
            label="Teams durchsuchen"
          />
        </form>
        <p className="sr-only" aria-live="polite">
          {filtered.length} Teams gefunden.
        </p>
        {filtered.length > 0 ? (
          <section className="team-grid" aria-label="Teams">
            {filtered.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </section>
        ) : (
          <EmptyState
            title="Kein Team gefunden"
            description="Versuche einen kürzeren Vereinsnamen oder öffne die universelle Suche."
            actionHref="/search"
            actionLabel="Alle Inhalte durchsuchen"
            icon={<Shirt aria-hidden="true" className="h-5 w-5" />}
          />
        )}
      </div>
    </div>
  );
}

export function TeamDetailView({ team }: { team: TeamSummary }) {
  return (
    <div className="page-shell">
      <div className="content-column">
        <header className="team-detail-header">
          <TeamBadge
            name={team.name}
            iconUrl={team.iconUrl}
            size={72}
            decorative
            className="team-badge-surface"
          />
          <div className="min-w-0 flex-1">
            <p className="eyebrow">
              {team.competitions.map((entry) => entry.label).join(" · ") || "Team"}
            </p>
            <h1 className="page-title">{team.name}</h1>
            <p className="page-description">
              Aktueller Ausschnitt mit nächster Partie, letztem Ergebnis und Tabelle.
            </p>
          </div>
          <FavoriteButton kind="team" id={team.id} label={team.name} />
        </header>

        <section className="team-context-grid" aria-label="Teamkontext">
          <div>
            <span>Tabellenplatz</span>
            <strong>{team.tablePosition ? `#${team.tablePosition.position}` : "–"}</strong>
          </div>
          <div>
            <span>Punkte</span>
            <strong>{team.tablePosition?.points ?? "–"}</strong>
          </div>
          <div>
            <span>Wettbewerbe</span>
            <strong>{team.competitions.length}</strong>
          </div>
        </section>

        <div className="grid gap-9">
          <section className="content-section">
            <div className="section-heading-row">
              <div>
                <h2 className="section-title">Nächstes Spiel</h2>
                <p className="section-description">
                  Die nächste bekannte Partie im geladenen Ausschnitt.
                </p>
              </div>
            </div>
            {team.upcomingMatches.length > 0 ? (
              <div className="match-list">
                {team.upcomingMatches.slice(0, 5).map((item) => (
                  <MatchSummary
                    key={`${item.competition.resolvedLeague}-${item.match.matchID}`}
                    item={item}
                  />
                ))}
              </div>
            ) : (
              <p className="inline-empty">Kein kommendes Spiel sichtbar.</p>
            )}
          </section>

          <section className="content-section">
            <div className="section-heading-row">
              <div>
                <h2 className="section-title">Letztes Ergebnis</h2>
                <p className="section-description">
                  Die jüngste beendete Partie im geladenen Ausschnitt.
                </p>
              </div>
            </div>
            {team.recentMatches.length > 0 ? (
              <div className="match-list">
                {team.recentMatches.slice(0, 5).map((item) => (
                  <MatchSummary
                    key={`${item.competition.resolvedLeague}-${item.match.matchID}`}
                    item={item}
                  />
                ))}
              </div>
            ) : (
              <p className="inline-empty">Kein beendetes Ergebnis sichtbar.</p>
            )}
          </section>

          <section className="content-section">
            <div className="section-heading-row">
              <div>
                <h2 className="section-title">Wettbewerbe</h2>
                <p className="section-description">Weitere Spiele und Tabellen öffnen.</p>
              </div>
            </div>
            <div className="context-link-list">
              {team.competitions.map((competition) => {
                const meta = getCompetitionMeta(competition.league);
                return (
                  <Link
                    key={competition.league}
                    href={`${meta.href}?season=${competition.season}`}
                  >
                    <span>{competition.label}</span>
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
