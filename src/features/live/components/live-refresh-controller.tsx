"use client";

import { RefreshCw, Satellite } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MatchCardList } from "@/features/football/components/match-card-list";
import {
  EmptyState,
  SectionHeading,
} from "@/features/football/components/product-ui";
import { getMatchStatus } from "@/features/football/view-utils";
import {
  getPollingScopes,
  mergeMatchdayPayload,
  parseMatchdayPollingPayload,
  type LiveMatchItem,
  type LiveMatchScope,
} from "./live-polling";

const REFRESH_INTERVAL_MS = 45_000;

const getScopeKey = ({ group, league, season }: LiveMatchScope) =>
  `${league}:${season}:${group}`;

const getRetryAtFromResponse = (response: Response) => {
  const retryAfter = Number.parseFloat(response.headers.get("retry-after") ?? "");
  return Number.isFinite(retryAfter) && retryAfter > 0
    ? Date.now() + retryAfter * 1_000
    : undefined;
};

export function LiveRefreshController({
  initialMatches,
}: {
  initialMatches: LiveMatchItem[];
}) {
  const [items, setItems] = useState(initialMatches);
  const [isPending, setIsPending] = useState(false);
  const [isDelayed, setIsDelayed] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const itemsRef = useRef(items);
  const activeRequest = useRef<AbortController | null>(null);
  const retryAtByScope = useRef(new Map<string, number>());

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const refresh = useCallback(async () => {
    if (activeRequest.current) return;

    const now = new Date();
    const scopes = getPollingScopes(itemsRef.current, now).filter(
      (scope) => (retryAtByScope.current.get(getScopeKey(scope)) ?? 0) <= now.getTime()
    );

    if (scopes.length === 0) return;

    const controller = new AbortController();
    activeRequest.current = controller;
    setIsPending(true);

    try {
      const results = await Promise.allSettled(
        scopes.map(async (scope) => {
          const query = new URLSearchParams({
            group: String(scope.group),
            league: scope.league,
            season: String(scope.season),
          });
          const response = await fetch(`/api/matchday?${query}`, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          });

          if (!response.ok) {
            const retryAt = getRetryAtFromResponse(response);
            if (retryAt) {
              retryAtByScope.current.set(getScopeKey(scope), retryAt);
            }
            throw new Error(`Matchday refresh failed (${response.status})`);
          }

          const payload = parseMatchdayPollingPayload(
            await response.json(),
            scope
          );
          if (!payload) throw new Error("Unexpected matchday response");

          if (payload.retryAt && payload.retryAt > Date.now()) {
            retryAtByScope.current.set(getScopeKey(scope), payload.retryAt);
          } else {
            retryAtByScope.current.delete(getScopeKey(scope));
          }

          return payload;
        })
      );
      const payloads = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : []
      );
      const failed = results.some((result) => result.status === "rejected");

      if (payloads.length > 0) {
        setItems((current) =>
          payloads.reduce(
            (merged, payload) => mergeMatchdayPayload(merged, payload),
            current
          )
        );

        const checkedAt = Math.max(
          ...payloads.map((payload) => payload.checkedAt ?? Date.now())
        );
        setLastChecked(new Date(checkedAt));
      }

      setIsDelayed(
        failed ||
          payloads.some(
            (payload) =>
              payload.refreshFailed || payload.refreshState === "stale"
          )
      );
    } finally {
      activeRequest.current = null;
      setIsPending(false);
    }
  }, []);

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

  const live = useMemo(
    () => items.filter((item) => getMatchStatus(item.match) === "live"),
    [items]
  );
  const upcoming = useMemo(
    () =>
      items
        .filter((item) => getMatchStatus(item.match) === "upcoming")
        .slice(0, 5),
    [items]
  );

  return (
    <>
      <div className="live-refresh-controller">
        <p role="status" aria-live="polite" aria-atomic="true">
          {isPending
            ? "Spielstände werden aktualisiert."
            : isDelayed
              ? lastChecked
                ? `Datenquelle verzögert. Letzter Stand von ${lastChecked.toLocaleTimeString(
                    "de-DE",
                    { hour: "2-digit", minute: "2-digit" }
                  )} Uhr.`
                : "Datenquelle verzögert. Der letzte bekannte Stand wird angezeigt."
              : lastChecked
                ? `Zuletzt geprüft um ${lastChecked.toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} Uhr.`
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
          <MatchCardList matches={live} />
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
          <MatchCardList matches={upcoming} />
        </section>
      ) : null}
    </>
  );
}
