"use client";

import { RefreshCw } from "lucide-react";
import { REFRESH_INTERVAL_MS } from "./visible-refresh";

export function RefreshStatus({
  isDelayed,
  isPending,
  lastChecked,
  onRefresh,
  pendingMessage,
}: {
  isDelayed: boolean;
  isPending: boolean;
  lastChecked: Date | null;
  onRefresh: () => void | Promise<void>;
  pendingMessage: string;
}) {
  const checkedTime = lastChecked?.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="live-refresh-controller">
      <p role="status" aria-live="polite" aria-atomic="true">
        {isPending
          ? pendingMessage
          : isDelayed
            ? checkedTime
              ? `Datenquelle verzögert. Letzter Stand von ${checkedTime} Uhr.`
              : "Datenquelle verzögert. Der letzte bekannte Stand wird angezeigt."
            : checkedTime
              ? `Zuletzt geprüft um ${checkedTime} Uhr.`
              : `Automatische Aktualisierung alle ${REFRESH_INTERVAL_MS / 1_000} Sekunden, solange der Tab sichtbar ist.`}
      </p>
      <button
        type="button"
        onClick={() => void onRefresh()}
        disabled={isPending}
        className="button-secondary"
      >
        <RefreshCw
          aria-hidden="true"
          className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
        />
        Aktualisieren
      </button>
    </div>
  );
}
