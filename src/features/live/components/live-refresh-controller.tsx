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
  type LiveMatchItem,
  type LiveMatchScope,
  mergeLiveDiscovery,
  mergeMatchdayPayload,
  parseLiveDiscoveryPayload,
  parseMatchdayPollingPayload,
} from "./live-polling";

const REFRESH_INTERVAL_MS = 45_000;
const DISCOVERY_INTERVAL_MS = 5 * 60_000;
const DISCOVERY_RETRY_MS = 60_000;

const getScopeKey = ({ group, league, season }: LiveMatchScope) =>
  `${league}:${season}:${group}`;

const getRetryAtFromResponse = (response: Response) => {
  const retryAfter = Number.parseFloat(
    response.headers.get("retry-after") ?? "",
  );
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
  const [pendingKind, setPendingKind] = useState<"discovery" | "scores" | null>(
    null,
  );
  const [isDiscoveryDelayed, setIsDiscoveryDelayed] = useState(false);
  const [isScoreDelayed, setIsScoreDelayed] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const itemsRef = useRef(items);
  const activeRequest = useRef<AbortController | null>(null);
  const nextDiscoveryAt = useRef(Number.POSITIVE_INFINITY);
  const retryAtByScope = useRef(new Map<string, number>());

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const refreshScores = useCallback(async () => {
    if (activeRequest.current) return;

    const now = new Date();
    const scopes = getPollingScopes(itemsRef.current, now).filter(
      (scope) =>
        (retryAtByScope.current.get(getScopeKey(scope)) ?? 0) <= now.getTime(),
    );

    if (scopes.length === 0) {
      setIsScoreDelayed(false);
      return;
    }

    const controller = new AbortController();
    activeRequest.current = controller;
    setPendingKind("scores");

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
            scope,
          );
          if (!payload) throw new Error("Unexpected matchday response");

          if (payload.retryAt && payload.retryAt > Date.now()) {
            retryAtByScope.current.set(getScopeKey(scope), payload.retryAt);
          } else {
            retryAtByScope.current.delete(getScopeKey(scope));
          }

          return payload;
        }),
      );
      const payloads = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );
      const failed = results.some((result) => result.status === "rejected");

      if (payloads.length > 0) {
        setItems((current) =>
          payloads.reduce(
            (merged, payload) => mergeMatchdayPayload(merged, payload),
            current,
          ),
        );

        const checkedAt = Math.max(
          ...payloads.map((payload) => payload.checkedAt ?? Date.now()),
        );
        setLastChecked((current) =>
          current && current.getTime() > checkedAt
            ? current
            : new Date(checkedAt),
        );
      }

      setIsScoreDelayed(
        failed ||
          payloads.some(
            (payload) =>
              payload.refreshFailed || payload.refreshState === "stale",
          ),
      );
    } finally {
      activeRequest.current = null;
      setPendingKind(null);
    }
  }, []);

  const refreshDiscovery = useCallback(async () => {
    if (activeRequest.current) return;

    const controller = new AbortController();
    activeRequest.current = controller;
    setPendingKind("discovery");

    try {
      const response = await fetch("/api/live-scopes", {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        nextDiscoveryAt.current =
          getRetryAtFromResponse(response) ?? Date.now() + DISCOVERY_RETRY_MS;
        throw new Error(`Live discovery failed (${response.status})`);
      }

      const payload = parseLiveDiscoveryPayload(await response.json());
      if (!payload) throw new Error("Unexpected live discovery response");

      const mergedItems = mergeLiveDiscovery(
        itemsRef.current,
        payload.matches,
        payload.failedLeagues,
      );
      itemsRef.current = mergedItems;
      setItems(mergedItems);
      setLastChecked((current) =>
        current && current.getTime() > payload.checkedAt
          ? current
          : new Date(payload.checkedAt),
      );
      setIsDiscoveryDelayed(payload.visibleErrors.length > 0);
      nextDiscoveryAt.current =
        Date.now() +
        (payload.visibleErrors.length > 0
          ? DISCOVERY_RETRY_MS
          : DISCOVERY_INTERVAL_MS);
    } catch {
      if (!controller.signal.aborted) {
        setIsDiscoveryDelayed(true);
        nextDiscoveryAt.current = Math.max(
          nextDiscoveryAt.current,
          Date.now() + DISCOVERY_RETRY_MS,
        );
      }
    } finally {
      activeRequest.current = null;
      setPendingKind(null);
    }
  }, []);

  const runScheduledRefresh = useCallback(async () => {
    if (Date.now() >= nextDiscoveryAt.current) {
      await refreshDiscovery();
    }

    await refreshScores();
  }, [refreshDiscovery, refreshScores]);

  useEffect(() => {
    nextDiscoveryAt.current = Date.now() + DISCOVERY_INTERVAL_MS;
    void refreshScores();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void runScheduledRefresh();
    };
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void runScheduledRefresh();
    }, REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      activeRequest.current?.abort();
    };
  }, [refreshScores, runScheduledRefresh]);

  const isDelayed = isDiscoveryDelayed || isScoreDelayed;
  const isPending = pendingKind !== null;
  const live = useMemo(
    () => items.filter((item) => getMatchStatus(item.match) === "live"),
    [items],
  );
  const upcoming = useMemo(
    () =>
      items
        .filter((item) => getMatchStatus(item.match) === "upcoming")
        .slice(0, 5),
    [items],
  );

  return (
    <>
      <div className="live-refresh-controller">
        <p role="status" aria-live="polite" aria-atomic="true">
          {isPending
            ? pendingKind === "discovery"
              ? "Spielplan wird aktualisiert."
              : "Spielstände werden aktualisiert."
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
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )} Uhr.`
                : "Automatische Aktualisierung alle 45 Sekunden, solange der Tab sichtbar ist."}
        </p>
        <button
          type="button"
          onClick={() => void refreshScores()}
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
        <section className="content-section mt-9">
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
