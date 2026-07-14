import { Satellite } from "lucide-react";
import type { WebHomeViewModel } from "@/features/home/presenter/home-view-model";
import {
  getMatchStatus,
  type CompetitionMatch,
} from "@/features/football/view-utils";
import { MatchList } from "@/features/football/components/match-summary";
import {
  DataNotice,
  EmptyState,
  PageIntro,
  PartialDataNotice,
  SectionHeading,
} from "@/features/football/components/product-ui";
import { LiveRefreshController } from "./live-refresh-controller";

const checkedFormatter = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

export function LiveView({
  data,
  matches,
}: {
  data: WebHomeViewModel;
  matches: CompetitionMatch[];
}) {
  const live = matches.filter((item) => getMatchStatus(item.match) === "live");
  const upcoming = matches
    .filter((item) => getMatchStatus(item.match) === "upcoming")
    .slice(0, 5);

  return (
    <div className="page-shell live-page">
      <div className="content-column">
        <PageIntro
          eyebrow="Live-Zentrale"
          title="Jetzt im Spiel"
          description={`Zuletzt geprüft um ${checkedFormatter.format(new Date())} Uhr. Live-Hinweise werden bewusst als Schätzung gekennzeichnet.`}
          actions={
            <span className="live-indicator">
              <span aria-hidden="true" />
              Datenstatus aktiv
            </span>
          }
        />

        <LiveRefreshController />

        <DataNotice>
          OpenLigaDB liefert weder einen bestätigten Live-Schalter noch die aktuelle
          Spielminute. „Läuft möglicherweise“ wird nur aus Anstoßzeit und fehlendem
          Endstatus abgeleitet.
        </DataNotice>
        <PartialDataNotice errors={data.visibleErrors} />

        <p className="sr-only" aria-live="polite">
          {live.length} möglicherweise laufende Spiele gefunden.
        </p>

        {live.length > 0 ? (
          <section className="content-section">
            <SectionHeading
              title="Läuft möglicherweise"
              count={live.length}
              description="Partien innerhalb des dreistündigen Live-Schätzfensters."
            />
            <MatchList matches={live} />
          </section>
        ) : (
          <EmptyState
            title="Gerade kein Live-Hinweis"
            description="Im geladenen Ausschnitt liegt keine unbeendete Partie im Live-Schätzfenster. Die nächsten geplanten Spiele stehen direkt darunter."
            actionHref="/today"
            actionLabel="Zum heutigen Spielplan"
            icon={<Satellite aria-hidden="true" className="h-5 w-5" />}
          />
        )}

        {upcoming.length > 0 ? (
          <section className="content-section">
            <SectionHeading
              title="Als Nächstes"
              count={upcoming.length}
              description="Die nächsten geplanten Anstoßzeiten im geladenen Ausschnitt."
            />
            <MatchList matches={upcoming} />
          </section>
        ) : null}

      </div>
    </div>
  );
}
