"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";

const REFRESH_INTERVAL_MS = 45_000;

export function LiveRefreshController() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
      setLastChecked(new Date());
    });
  }, [router]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [refresh]);

  return (
    <div className="live-refresh-controller">
      <p role="status" aria-live="polite" aria-atomic="true">
        {isPending
          ? "Spielstände werden aktualisiert."
          : lastChecked
            ? `Zuletzt aktualisiert um ${lastChecked.toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
              })} Uhr.`
            : "Automatische Aktualisierung alle 45 Sekunden, solange der Tab sichtbar ist."}
      </p>
      <button type="button" onClick={refresh} disabled={isPending} className="button-secondary">
        <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
        Aktualisieren
      </button>
    </div>
  );
}
