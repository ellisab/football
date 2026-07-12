import { CalendarX2 } from "lucide-react";
import Link from "next/link";
import type { WebHomeViewModel } from "@/features/home/presenter/home-view-model";
import {
  getMatchStatus,
  getStatusCounts,
  getVisibleCompetitions,
  collectTeams,
  type CompetitionMatch,
} from "@/features/football/view-utils";
import { DateNavigator } from "@/features/football/components/date-navigator";
import { MatchList } from "@/features/football/components/match-summary";
import {
  DataNotice,
  EmptyState,
  PageIntro,
  PartialDataNotice,
  SectionHeading,
} from "@/features/football/components/product-ui";
import { getCompetitionMeta } from "@/features/football/competition-meta";
import { FavoriteSpotlight } from "@/features/favorites";

function MatchSection({
  description,
  matches,
  title,
}: {
  description: string;
  matches: CompetitionMatch[];
  title: string;
}) {
  if (matches.length === 0) return null;

  return (
    <section className="content-section">
      <SectionHeading count={matches.length} description={description} title={title} />
      <MatchList matches={matches} />
    </section>
  );
}

export function TodayView({
  data,
  dateKey,
  matches,
}: {
  data: WebHomeViewModel;
  dateKey: string;
  matches: CompetitionMatch[];
}) {
  const competitions = getVisibleCompetitions(data);
  const favoriteItems = [
    ...competitions.map((competition) => {
      const meta = getCompetitionMeta(competition.resolvedLeague);
      return {
        href: `${meta.href}?season=${competition.resolvedSeason}`,
        id: competition.resolvedLeague,
        kind: "competition" as const,
        label: meta.label,
      };
    }),
    ...collectTeams(competitions).map((team) => ({
      href: `/teams/${team.id}`,
      id: team.id,
      kind: "team" as const,
      label: team.name,
    })),
  ];
  const counts = getStatusCounts(matches);
  const live = matches.filter((item) => getMatchStatus(item.match) === "live");
  const upcoming = matches.filter(
    (item) => getMatchStatus(item.match) === "upcoming"
  );
  const unknown = matches.filter((item) => getMatchStatus(item.match) === "unknown");
  const finished = matches.filter(
    (item) => getMatchStatus(item.match) === "finished"
  );

  return (
    <div className="page-shell today-page">
      <div className="content-column">
        <PageIntro
          eyebrow="Spielplan"
          title="Heute im Fußball"
          description="Anstoß, Status und Ergebnis auf einen Blick – ohne Umwege und ohne erfundene Live-Daten."
        />

        <DateNavigator dateKey={dateKey} />

        <div className="score-summary" aria-label="Zusammenfassung des Tages">
          <div>
            <strong>{matches.length}</strong>
            <span>Spiele</span>
          </div>
          <div>
            <strong>{counts.live}</strong>
            <span>möglicherweise live</span>
          </div>
          <div>
            <strong>{counts.upcoming}</strong>
            <span>geplant</span>
          </div>
          <div>
            <strong>{counts.finished}</strong>
            <span>beendet</span>
          </div>
        </div>

        <FavoriteSpotlight items={favoriteItems} />

        <DataNotice>
          Die Datumsliste zeigt den aktuell geladenen Ausschnitt der unterstützten
          Wettbewerbe. OpenLigaDB bietet keine vollständige wettbewerbsübergreifende
          Datumssuche.
        </DataNotice>
        <PartialDataNotice errors={data.visibleErrors} />

        <p className="sr-only" aria-live="polite">
          {matches.length} Spiele geladen, davon {counts.live} möglicherweise live.
        </p>

        {matches.length === 0 ? (
          <EmptyState
            title="Keine Spiele in diesem Ausschnitt"
            description="Für das gewählte Datum sind in den aktuell geladenen Spieltagen keine Partien vorhanden. Wechsle das Datum oder öffne einen Wettbewerb."
            icon={<CalendarX2 aria-hidden="true" className="h-5 w-5" />}
          />
        ) : (
          <div className="grid gap-9">
            <MatchSection
              title="Möglicherweise live"
              description="Aus der Anstoßzeit abgeleitet; der Datenfeed liefert keinen bestätigten Live-Status."
              matches={live}
            />
            <MatchSection
              title="Als Nächstes"
              description="Geplante Partien, chronologisch nach Anstoß."
              matches={upcoming}
            />
            <MatchSection
              title="Status offen"
              description="Unbeendete Partien, deren Anstoß länger zurückliegt oder fehlt."
              matches={unknown}
            />
            <MatchSection
              title="Beendet"
              description="Abgeschlossene Partien des ausgewählten Tages."
              matches={finished}
            />
          </div>
        )}

        <section className="content-section mt-10">
          <SectionHeading
            title="Alle Wettbewerbe"
            description="Direkt zu Spieltagen, Ergebnissen und Tabellen."
          />
          <div className="competition-quick-links">
            {competitions.map((competition) => {
              const meta = getCompetitionMeta(competition.resolvedLeague);
              return (
                <Link
                  key={competition.resolvedLeague}
                  href={`${meta.href}?season=${competition.resolvedSeason}`}
                >
                  {meta.shortLabel}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
