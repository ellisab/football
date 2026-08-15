"use client";

import type { LeagueKey } from "@footballleagues/core/leagues";
import type { ApiTableRow } from "@footballleagues/core/openligadb";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { StandingsCard } from "./standings-card";

const REFRESH_INTERVAL_MS = 45_000;

type TablePayload = {
  checkedAt: number;
  resolvedLeague: LeagueKey;
  resolvedSeason: number;
  table: ApiTableRow[];
};

const isTablePayload = (
  value: unknown,
  league: LeagueKey,
  season: number,
): value is TablePayload => {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<TablePayload>;
  return (
    typeof payload.checkedAt === "number" &&
    payload.resolvedLeague === league &&
    payload.resolvedSeason === season &&
    Array.isArray(payload.table)
  );
};

export function StandingsRefreshController({
  initialTable,
  league,
  season,
}: {
  initialTable: ApiTableRow[];
  league: LeagueKey;
  season: number;
}) {
  const [table, setTable] = useState(initialTable);
  const [isPending, setIsPending] = useState(false);
  const [isDelayed, setIsDelayed] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    setTable(initialTable);
  }, [initialTable]);

  const refresh = useCallback(async () => {
    if (activeRequest.current) return;

    const controller = new AbortController();
    activeRequest.current = controller;
    setIsPending(true);

    try {
      const query = new URLSearchParams({
        league,
        season: String(season),
      });
      const response = await fetch(`/api/table?${query}`, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Table refresh failed (${response.status})`);
      }

      const payload: unknown = await response.json();
      if (!isTablePayload(payload, league, season)) {
        throw new Error("Unexpected table response");
      }

      setTable(payload.table);
      setLastChecked(new Date(payload.checkedAt));
      setIsDelayed(false);
    } catch {
      if (!controller.signal.aborted) setIsDelayed(true);
    } finally {
      activeRequest.current = null;
      setIsPending(false);
    }
  }, [league, season]);

  useEffect(() => {
    void refresh();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      activeRequest.current?.abort();
    };
  }, [refresh]);

  return (
    <>
      <div className="live-refresh-controller">
        <p role="status" aria-live="polite" aria-atomic="true">
          {isPending
            ? "Tabelle wird aktualisiert."
            : isDelayed
              ? lastChecked
                ? `Datenquelle verzögert. Letzter Stand von ${lastChecked.toLocaleTimeString(
                    "de-DE",
                    { hour: "2-digit", minute: "2-digit" },
                  )} Uhr.`
                : "Datenquelle verzögert. Der letzte bekannte Stand wird angezeigt."
              : lastChecked
                ? `Zuletzt geprüft um ${lastChecked.toLocaleTimeString(
                    "de-DE",
                    { hour: "2-digit", minute: "2-digit" },
                  )} Uhr.`
                : "Automatische Aktualisierung alle 45 Sekunden, solange der Tab sichtbar ist."}
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
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

      <StandingsCard table={table} emptyText="Keine Tabelle verfügbar." />
    </>
  );
}
