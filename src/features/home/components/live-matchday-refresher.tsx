"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { LeagueKey } from "@footballleagues/core/leagues";

export type LiveMatchdayPollTarget = {
  groupOrderID: number;
  lastChanged?: string;
  league: LeagueKey;
  season: number;
};

const LIVE_POLL_INTERVAL_MS = 45_000;

const getTargetKey = (target: LiveMatchdayPollTarget) => {
  return `${target.league}:${target.season}:${target.groupOrderID}`;
};

export function LiveMatchdayRefresher({
  targets,
}: {
  targets: LiveMatchdayPollTarget[];
}) {
  const router = useRouter();

  useEffect(() => {
    if (targets.length === 0) return;

    let disposed = false;
    const knownLastChanged = new Map(
      targets.map((target) => [getTargetKey(target), target.lastChanged])
    );

    const poll = async () => {
      const responses = await Promise.allSettled(
        targets.map(async (target) => {
          const search = new URLSearchParams({
            group: String(target.groupOrderID),
            league: target.league,
            season: String(target.season),
          });
          const response = await fetch(`/api/matchday?${search.toString()}`);

          if (!response.ok) return undefined;

          return {
            key: getTargetKey(target),
            payload: (await response.json()) as {
              lastChanged?: string;
            },
          };
        })
      );

      if (disposed) return;

      const changed = responses.some((result) => {
        if (result.status !== "fulfilled" || !result.value?.payload.lastChanged) {
          return false;
        }

        const previous = knownLastChanged.get(result.value.key);

        if (previous === undefined) {
          knownLastChanged.set(result.value.key, result.value.payload.lastChanged);
          return false;
        }

        return previous !== result.value.payload.lastChanged;
      });

      if (changed) {
        router.refresh();
      }
    };

    const interval = window.setInterval(() => {
      void poll();
    }, LIVE_POLL_INTERVAL_MS);

    void poll();

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [router, targets]);

  return null;
}
