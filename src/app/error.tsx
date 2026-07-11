"use client";

import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <div className="page-shell">
      <div className="content-column">
        <section className="error-state" role="alert">
          <div className="empty-state-icon">
            <TriangleAlert aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <p className="eyebrow">Verbindung unterbrochen</p>
            <h1 className="page-title">Die Daten konnten nicht geladen werden</h1>
            <p className="page-description">
              Der Rahmen bleibt verfügbar. Versuche die Anfrage erneut oder kehre zum
              heutigen Spielplan zurück.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={reset} className="button-primary">
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Erneut versuchen
            </button>
            <Link href="/today" className="button-secondary">
              Zu Heute
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
