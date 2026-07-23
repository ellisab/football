import {
  DataNotice,
  PageIntro,
  PartialDataNotice,
} from "@/features/football/components/product-ui";
import { LiveRefreshController } from "./live-refresh-controller";
import type { LiveMatchItem } from "./live-polling";

export function LiveView({
  initialMatches,
  visibleErrors,
}: {
  initialMatches: LiveMatchItem[];
  visibleErrors: string[];
}) {
  return (
    <div className="page-shell match-feed-page live-page">
      <div className="content-column">
        <PageIntro
          eyebrow="Live-Zentrale"
          title="Jetzt im Spiel"
          description="Spielstände werden pro aktivem Spieltag gemeinsam aktualisiert. Live-Hinweise werden bewusst als Schätzung gekennzeichnet."
          actions={
            <span className="live-indicator">
              <span aria-hidden="true" />
              Datenstatus aktiv
            </span>
          }
        />

        <DataNotice>
          OpenLigaDB liefert weder einen bestätigten Live-Schalter noch die aktuelle
          Spielminute. „Läuft möglicherweise“ wird nur aus Anstoßzeit und fehlendem
          Endstatus abgeleitet.
        </DataNotice>
        <PartialDataNotice errors={visibleErrors} />
        <LiveRefreshController initialMatches={initialMatches} />
      </div>
    </div>
  );
}
