import Link from "next/link";
import { List, Table2, Trophy } from "lucide-react";
import type { ApiMatch, ApiTableRow } from "@footballleagues/core/openligadb";
import type { WebCompetitionViewModel } from "@/features/home/presenter/home-view-model";
import {
  getCompetitionMeta,
  getCompetitionHref,
} from "@/features/football/competition-meta";
import { MatchList } from "@/features/football/components/match-summary";
import {
  EmptyState,
  PageIntro,
  PartialDataNotice,
  SectionHeading,
} from "@/features/football/components/product-ui";
import { StandingsCard } from "@/features/standings/components/standings-card";
import { FavoriteButton } from "@/features/favorites";
import {
  getMatchStatus,
  getStatusCounts,
} from "@/features/football/view-utils";
import { MatchdayNavigator } from "./matchday-navigator";

const tabHref = ({
  matchday,
  season,
  slug,
  scope,
  view,
}: {
  matchday?: number;
  season: number;
  slug: string;
  scope?: "all" | "fixtures" | "results";
  view: "matches" | "standings";
}) => {
  const query = new URLSearchParams({ season: String(season), view });
  if (scope && scope !== "all") query.set("scope", scope);
  if (matchday) query.set("matchday", String(matchday));
  return `/competitions/${slug}?${query.toString()}`;
};

export function CompetitionView({
  competition,
  currentMatchday,
  matches,
  matchdayError,
  selectedMatchday,
  scope,
  view,
}: {
  competition: WebCompetitionViewModel;
  currentMatchday?: number;
  matches: ApiMatch[];
  matchdayError?: string;
  selectedMatchday?: number;
  scope: "all" | "fixtures" | "results";
  view: "matches" | "standings";
}) {
  const meta = getCompetitionMeta(competition.resolvedLeague);
  const Icon = meta.icon;
  const tableSection = competition.sections.find(
    (section) => section.renderKind === "table"
  );
  const table =
    tableSection?.renderKind === "table" ? tableSection.items : ([] as ApiTableRow[]);
  const worldCupTables =
    competition.worldCup?.groupSections.filter((section) => section.table.length > 0) ?? [];
  const seasonOption = competition.leagueOptions.find(
    (option) => option.shortcut === competition.resolvedLeague
  );
  const groups = competition.availableGroups ?? [];
  const statusCounts = getStatusCounts(
    matches.map((match) => ({ competition, match }))
  );
  const visibleMatches = matches.filter((match) => {
    if (scope === "results") return getMatchStatus(match) === "finished";
    if (scope === "fixtures") return getMatchStatus(match) !== "finished";
    return true;
  });

  return (
    <div className="page-shell">
      <div className="wide-column">
        <div className="competition-accent" aria-hidden="true" />
        <PageIntro
          eyebrow={`${meta.region} · ${meta.category}`}
          title={meta.label}
          description={meta.description}
          actions={
            <div className="flex items-center gap-2">
              <span className="competition-mark" aria-hidden="true">
                <Icon className="h-5 w-5" />
              </span>
              <FavoriteButton
                kind="competition"
                id={competition.resolvedLeague}
                label={meta.label}
                className="semantic-favorite-button"
              />
            </div>
          }
        />

        <div className="competition-controls">
          <form method="get" className="season-form">
            <label htmlFor="season" className="control-label">
              Saison
            </label>
            <select
              id="season"
              name="season"
              className="select-control"
              defaultValue={String(competition.resolvedSeason)}
            >
              {(seasonOption?.seasons ?? [competition.resolvedSeason]).map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
            <input type="hidden" name="view" value={view} />
            {scope !== "all" ? <input type="hidden" name="scope" value={scope} /> : null}
            <button className="button-secondary" type="submit">
              Wechseln
            </button>
          </form>

          <nav className="segmented-control" aria-label="Wettbewerbsansicht">
            <Link
              href={tabHref({
                matchday: selectedMatchday,
                season: competition.resolvedSeason,
                slug: meta.slug,
                scope,
                view: "matches",
              })}
              aria-current={view === "matches" ? "page" : undefined}
            >
              <List aria-hidden="true" className="h-4 w-4" />
              Spiele
            </Link>
            <Link
              href={tabHref({
                matchday: selectedMatchday,
                season: competition.resolvedSeason,
                slug: meta.slug,
                scope,
                view: "standings",
              })}
              aria-current={view === "standings" ? "page" : undefined}
            >
              <Table2 aria-hidden="true" className="h-4 w-4" />
              Tabelle
            </Link>
          </nav>
        </div>

        <MatchdayNavigator
          currentMatchday={currentMatchday}
          groups={groups}
          season={competition.resolvedSeason}
          selectedMatchday={selectedMatchday}
          slug={meta.slug}
          scope={scope}
          view={view}
        />

        {view === "matches" ? (
          <div className="score-summary" aria-label="Status der ausgewählten Runde">
            <div>
              <strong>{matches.length}</strong>
              <span>Spiele</span>
            </div>
            <div>
              <strong>{statusCounts.live}</strong>
              <span>möglicherweise live</span>
            </div>
            <div>
              <strong>{statusCounts.upcoming}</strong>
              <span>geplant</span>
            </div>
            <div>
              <strong>{statusCounts.finished}</strong>
              <span>beendet</span>
            </div>
          </div>
        ) : null}

        <PartialDataNotice errors={competition.visibleErrors} />

        {view === "matches" ? (
          <section className="content-section">
            <nav className="match-filter-tabs" aria-label="Spiele filtern">
              {(
                [
                  ["all", "Alle"],
                  ["fixtures", "Spielplan"],
                  ["results", "Ergebnisse"],
                ] as const
              ).map(([value, label]) => (
                <Link
                  key={value}
                  href={tabHref({
                    matchday: selectedMatchday,
                    season: competition.resolvedSeason,
                    slug: meta.slug,
                    scope: value,
                    view: "matches",
                  })}
                  aria-current={scope === value ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <SectionHeading
              title={
                groups.find((group) => group.groupOrderID === selectedMatchday)?.groupName ??
                (selectedMatchday ? `${selectedMatchday}. Spieltag` : "Aktuelle Spiele")
              }
              count={visibleMatches.length}
              description={`Saison ${competition.resolvedSeason} · Anstoßzeiten in deiner lokalen Zeitzone.`}
            />
            {matchdayError ? (
              <EmptyState
                title="Runde nicht verfügbar"
                description={matchdayError}
                actionHref={getCompetitionHref(
                  seasonOption ?? {
                    shortcut: competition.resolvedLeague,
                    seasons: [competition.resolvedSeason],
                  },
                  competition.resolvedSeason
                )}
                actionLabel="Zur aktuellen Runde"
              />
            ) : visibleMatches.length > 0 ? (
              <MatchList
                matches={visibleMatches.map((match) => ({ competition, match }))}
                showCompetition={false}
              />
            ) : (
              <EmptyState
                title="Noch keine Spiele"
                description={scope === "results" ? "Für diese Runde sind noch keine beendeten Partien verfügbar." : scope === "fixtures" ? "Für diese Runde sind keine offenen Partien verfügbar." : "Für diese Runde sind aktuell keine Partien verfügbar. Wähle eine andere Runde oder kehre zur aktuellen zurück."}
                actionHref="/today"
                actionLabel="Heutige Spiele ansehen"
              />
            )}
          </section>
        ) : (
          <section className="content-section">
            <SectionHeading
              title="Tabelle"
              description="Nur verifizierbare Tabellenwerte – ohne abgeleitete Qualifikations- oder Abstiegszonen."
            />
            {worldCupTables.length > 0 ? (
              <div className="grid gap-6">
                {worldCupTables.map((section) => (
                  <section key={section.group.groupID ?? section.title} className="grid gap-3">
                    <h3 className="text-base font-semibold text-[var(--text)]">{section.title}</h3>
                    <StandingsCard table={section.table} emptyText="Keine Tabelle verfügbar." />
                  </section>
                ))}
              </div>
            ) : table.length > 0 ? (
              <StandingsCard table={table} emptyText="Keine Tabelle verfügbar." />
            ) : (
              <EmptyState
                title="Keine Tabelle verfügbar"
                description="Dieser Wettbewerb stellt für die ausgewählte Saison keine verlässlichen Tabellendaten bereit."
                actionHref={tabHref({
                  matchday: selectedMatchday,
                  season: competition.resolvedSeason,
                  slug: meta.slug,
                  scope,
                  view: "matches",
                })}
                actionLabel="Spiele öffnen"
                icon={<Trophy aria-hidden="true" className="h-5 w-5" />}
              />
            )}
          </section>
        )}
      </div>
    </div>
  );
}
