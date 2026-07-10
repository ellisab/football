"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LeagueKey } from "@footballleagues/core/leagues";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import {
  getMatchIdentity,
  getMatchScore,
  getMatchStatus,
  getMatchStatusLabel,
  getMatchTime,
  getTeamLabel,
} from "@/features/football/view-utils";
import { getCompetitionMeta } from "@/features/football/competition-meta";
import { TeamBadge } from "@/features/teams/components/team-badge";
import { ArrowRight, Clock3, Radio } from "lucide-react";
import { SectionKicker } from "./section-kicker";

type MatchTickerItem = {
  league: LeagueKey;
  match: ApiMatch;
};

const LIVE_TICKER_MATCH_LIMIT = 14;
const LIVE_TICKER_POLL_INTERVAL_MS = 45_000;
const PRE_KICKOFF_REFRESH_WINDOW_MS = 15 * 60 * 1_000;
const POST_KICKOFF_REFRESH_WINDOW_MS = 4 * 60 * 60 * 1_000;

const getMatchId = (match: ApiMatch) => {
  return typeof match.matchID === "number" ? match.matchID : undefined;
};

const shouldRefreshMatch = (match: ApiMatch, now: Date) => {
  const matchId = getMatchId(match);
  if (!matchId) return false;

  const kickoff = getMatchTime(match);
  if (kickoff === Number.MAX_SAFE_INTEGER) {
    return getMatchStatus(match, now) === "live";
  }

  const untilKickoff = kickoff - now.getTime();
  const sinceKickoff = now.getTime() - kickoff;

  return (
    untilKickoff <= PRE_KICKOFF_REFRESH_WINDOW_MS &&
    sinceKickoff <= POST_KICKOFF_REFRESH_WINDOW_MS
  );
};

const getFreshMatches = async (matchIds: number[], signal: AbortSignal) => {
  const search = new URLSearchParams({
    ids: matchIds.join(","),
  });
  const response = await fetch(`/api/matches?${search.toString()}`, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as { matches?: ApiMatch[] };
  return payload.matches ?? [];
};

export function MatchTicker({ items }: { items: MatchTickerItem[] }) {
  const visibleItems = useMemo(
    () => items.slice(0, LIVE_TICKER_MATCH_LIMIT),
    [items]
  );
  const [freshMatches, setFreshMatches] = useState<Map<number, ApiMatch>>(
    () => new Map()
  );

  useEffect(() => {
    if (visibleItems.length === 0) return;

    let disposed = false;
    let controller: AbortController | undefined;

    const refresh = async () => {
      const now = new Date();
      const matchIds = Array.from(
        new Set(
          visibleItems
            .filter((item) => shouldRefreshMatch(item.match, now))
            .map((item) => getMatchId(item.match))
            .filter((id): id is number => typeof id === "number")
        )
      );

      if (matchIds.length === 0) return;

      controller?.abort();
      controller = new AbortController();

      try {
        const matches = await getFreshMatches(matchIds, controller.signal);
        if (disposed || matches.length === 0) return;

        setFreshMatches((current) => {
          const next = new Map(current);

          for (const match of matches) {
            const matchId = getMatchId(match);
            if (matchId) next.set(matchId, match);
          }

          return next;
        });
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") return;
      }
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, LIVE_TICKER_POLL_INTERVAL_MS);

    return () => {
      disposed = true;
      controller?.abort();
      window.clearInterval(interval);
    };
  }, [visibleItems]);

  const mergedItems = visibleItems.map((item) => {
    const matchId = getMatchId(item.match);
    const freshMatch = matchId ? freshMatches.get(matchId) : undefined;

    return {
      ...item,
      match: freshMatch ?? item.match,
    };
  });

  if (items.length === 0) {
    return (
      <section className="poster-surface relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#061512]/88 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <SectionKicker>Live-Leiste</SectionKicker>
            <p className="mt-2 text-sm text-[#a8bbb2]">
              In den aktuellen Daten sind keine laufenden oder kommenden Spiele sichtbar.
            </p>
          </div>
          <Clock3 className="h-5 w-5 text-[#6eeaf2]" />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Live und kommende Spiele"
      className="poster-surface live-rail relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#061512]/88 p-3"
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-[#6eeaf2]/30 bg-[#07363a]/70 text-[#ddfbff]">
            <Radio className="h-4 w-4" />
          </span>
          <div>
            <SectionKicker>Jetzt / Gleich / Ende</SectionKicker>
            <p className="mt-1 text-xs text-[#8da49b]">Spiel-Leiste wischen</p>
          </div>
        </div>
        <Link
          href="/today"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-bold text-[#f2f7f2] transition-colors hover:border-[#6eeaf2]/30 hover:bg-white/[0.08]"
        >
          Alles heute
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {mergedItems.map((item, index) => {
          const { league, match } = item;
          const status = getMatchStatus(match);
          const meta = getCompetitionMeta(league);
          const Icon = meta.icon;
          const score = getMatchScore(match);
          const [team1Score = "-", team2Score = "-"] = score.split(":");
          const href = match.matchID ? `/matches/${match.matchID}` : "#today";

          return (
            <Link
              key={`${league}-${getMatchIdentity(match)}-${index}`}
              href={href}
              className="group grid min-h-[9rem] w-[17.5rem] shrink-0 content-between overflow-hidden rounded-[1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-3 transition-all hover:-translate-y-0.5 hover:border-[#6eeaf2]/35 hover:bg-white/[0.08]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#d8b86a]">
                  <Icon className="h-3 w-3" />
                  <span className="truncate">{meta.shortLabel}</span>
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] ${
                    status === "live"
                      ? "live-chip border border-[#6eeaf2]/35 bg-[#07363a]/70 text-[#ddfbff]"
                      : status === "finished"
                        ? "border border-[#d8b86a]/25 bg-[#273021]/46 text-[#f5edc9]"
                        : "border border-white/10 bg-white/[0.045] text-[#a8bbb2]"
                  }`}
                >
                  {getMatchStatusLabel(match)}
                </span>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <TeamBadge
                      name={getTeamLabel(match.team1, "Offen")}
                      iconUrl={match.team1?.teamIconUrl}
                      size={26}
                      className="bg-white/10 ring-1 ring-white/10"
                    />
                    <span className="truncate text-sm font-semibold text-[#f2f7f2]">
                      {getTeamLabel(match.team1, "Offen")}
                    </span>
                  </div>
                  <span className="font-mono text-lg font-bold text-[#f5edc9]">
                    {team1Score}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <TeamBadge
                      name={getTeamLabel(match.team2, "Offen")}
                      iconUrl={match.team2?.teamIconUrl}
                      size={26}
                      className="bg-white/10 ring-1 ring-white/10"
                    />
                    <span className="truncate text-sm font-semibold text-[#f2f7f2]">
                      {getTeamLabel(match.team2, "Offen")}
                    </span>
                  </div>
                  <span className="font-mono text-lg font-bold text-[#f5edc9]">
                    {team2Score}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
