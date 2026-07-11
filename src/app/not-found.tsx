import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="page-shell">
      <div className="content-column">
        <section className="error-state">
          <div className="empty-state-icon">
            <SearchX aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <p className="eyebrow">Fehler 404</p>
            <h1 className="page-title">Diese Seite steht nicht auf dem Spielplan</h1>
            <p className="page-description">
              Der Link ist möglicherweise veraltet. Suche direkt oder öffne einen
              unterstützten Wettbewerb.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/today" className="button-primary">
              Heutige Spiele
            </Link>
            <Link href="/search" className="button-secondary">
              Suchen
            </Link>
            <Link href="/competitions" className="button-secondary">
              Wettbewerbe
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
