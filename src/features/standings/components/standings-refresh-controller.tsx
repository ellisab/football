"use client";

import type { LeagueKey } from "@footballleagues/core/leagues";
import type { ApiTableRow } from "@footballleagues/core/openligadb";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshStatus } from "@/features/football/refresh/refresh-status";
import { useVisibleRefresh } from "@/features/football/refresh/use-visible-refresh";
import { StandingsCard } from "./standings-card";

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

  useVisibleRefresh({ activeRequest, onRefresh: refresh });

  return (
    <>
      <RefreshStatus
        isDelayed={isDelayed}
        isPending={isPending}
        lastChecked={lastChecked}
        onRefresh={refresh}
        pendingMessage="Tabelle wird aktualisiert."
      />

      <StandingsCard table={table} emptyText="Keine Tabelle verfügbar." />
    </>
  );
}
