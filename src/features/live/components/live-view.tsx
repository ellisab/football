import { PageIntro } from "@/features/football/components/product-ui";
import type { LiveMatchItem } from "./live-polling";
import { LiveRefreshController } from "./live-refresh-controller";

export function LiveView({
  initialMatches,
}: {
  initialMatches: LiveMatchItem[];
}) {
  return (
    <div className="page-shell match-feed-page live-page">
      <div className="content-column">
        <PageIntro
          eyebrow="Live-Zentrale"
          title="Jetzt im Spiel"
          description="Spielstände werden pro aktivem Spieltag gemeinsam aktualisiert. Live-Hinweise werden bewusst als Schätzung gekennzeichnet."
        />

        <LiveRefreshController initialMatches={initialMatches} />
      </div>
    </div>
  );
}
