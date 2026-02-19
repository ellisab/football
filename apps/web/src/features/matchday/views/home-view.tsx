import type { CSSProperties } from "react";
import Link from "next/link";
import { formatKickoff, getFinalResult, type ApiMatch, type LeagueKey } from "@footballleagues/core";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CircleDot,
  Clock3,
  Flag,
  Goal,
  Medal,
  ScanEye,
  Shirt,
  Shield,
  Trophy,
} from "lucide-react";
import { BracketSection } from "@/features/champions-league/components/bracket-section";
import { MatchCard } from "@/features/matchday/components/match-card";
import type { HomeData } from "@/features/matchday/server/types";
import { StandingsCard } from "@/features/standings/components/standings-card";

const getMatchKey = (match: ApiMatch, index: number) => {
  return (
    match.matchID ?? `${match.team1?.teamId ?? "home"}-${match.team2?.teamId ?? "away"}-${index}`
  );
};

const leagueStyles: Record<LeagueKey, { label: string; icon: LucideIcon }> = {
  bl1: { label: "Bundesliga", icon: Goal },
  bl2: { label: "2. Bundesliga", icon: Shirt },
  cl: { label: "Champions League", icon: Trophy },
  dfb: { label: "DFB Pokal", icon: Flag },
  pl: { label: "Premier League", icon: Shield },
  el: { label: "Europa League", icon: Medal },
};

const stripSeasonSuffix = (label: string) => {
  return label.replace(/\s\d{4}(?:\/\d{2})?$/, "").trim();
};

const getLeagueLabel = (league: LeagueKey, fallbackLabel: string) => {
  return leagueStyles[league]?.label ?? stripSeasonSuffix(fallbackLabel);
};

export function HomeView({ data }: { data: HomeData }) {
  const themeStyles = {
    "--accent": "#d5001d",
    "--accent-soft": "#ffe4e8",
    "--accent-glow": "rgba(213, 0, 29, 0.32)",
  } as CSSProperties;

  const featuredMatch = data.matches[0] ?? data.nextRoundMatches[0];
  const featuredResult = featuredMatch ? getFinalResult(featuredMatch) : null;
  const featuredScore = featuredResult
    ? `${featuredResult.pointsTeam1 ?? 0} - ${featuredResult.pointsTeam2 ?? 0}`
    : "Score pending";
  const featuredKickoff = featuredMatch
    ? formatKickoff(featuredMatch.matchDateTimeUTC ?? featuredMatch.matchDateTime)
    : "Awaiting kickoff";
  const featuredTitle = featuredMatch
    ? `${featuredMatch.team1?.teamName ?? "Home"} vs ${featuredMatch.team2?.teamName ?? "Away"}`
    : `${data.activeLeagueLabel} Matchday Highlights`;
  const featuredSummary = featuredMatch
    ? `${data.currentGroupName} in ${data.activeLeagueLabel}. Freshly updated fixtures and results.`
    : `We're fetching the latest fixtures for ${data.activeLeagueLabel}.`;

  const actionCards = [
    {
      href: "#matches",
      icon: Goal,
      title: "Latest Results",
      description: "Track every scoreline from first whistle to final.",
    },
    {
      href: data.showInlineTable || data.showSidebarTable ? "#table" : "#matches",
      icon: data.showInlineTable || data.showSidebarTable ? Medal : ScanEye,
      title: data.showInlineTable || data.showSidebarTable ? "Standings" : "Match Insights",
      description:
        data.showInlineTable || data.showSidebarTable
          ? "Jump straight to the latest table shifts."
          : "Scan upcoming ties and in-round momentum.",
    },
  ];

  return (
    <div style={themeStyles} className="app-shell min-h-screen w-full overflow-x-hidden text-[#14161b]">
      <main className="mx-auto flex w-full max-w-[1220px] flex-col gap-10 px-2 pb-14 pt-3 sm:px-5 sm:pb-20 sm:pt-5">
        <section className="hero-panel overflow-hidden rounded-[1.7rem] px-4 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7">
          <div className="grid gap-6">
            <div className="flex flex-wrap gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/90">
              <span className="score-pill rounded-full px-3 py-1">Matchday Brief</span>
              <span className="score-pill rounded-full px-3 py-1">
                {getLeagueLabel(data.resolvedLeague, data.activeLeagueLabel)}
              </span>
              <span className="score-pill rounded-full px-3 py-1">Season {data.resolvedSeason}</span>
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-medium text-[#ffeef1]">Stadium lights are on</p>
              <h1 className="max-w-3xl font-display text-5xl leading-[0.9] uppercase tracking-[0.04em] text-[#fffafb] drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)] sm:text-6xl lg:text-7xl">
                Your{" "}
                <span className="text-[#ffe1e6]">matchday</span>{" "}
                control room
              </h1>
              <p className="max-w-2xl text-sm text-[#ffd9df] sm:text-base">
                Live fixtures, tables, and knockout drama in one pitch-side view.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="section-kicker">Categories</div>
          <div className="flex flex-wrap gap-3">
            {data.leagueOptions.map((option) => {
              const isActive = option.shortcut === data.resolvedLeague;
              const Icon = leagueStyles[option.shortcut]?.icon ?? Goal;
              const season = option.seasons[0] ?? data.resolvedSeason;

              return (
                <Link
                  key={option.shortcut}
                  href={`/?league=${option.shortcut}&season=${season}`}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[#470d19] shadow-[0_10px_24px_var(--accent-glow)]"
                      : "border-[#d4d7df] bg-[#f8f8fb] text-[#1f232c] hover:border-[#c2c6d0] hover:bg-[#f0f2f7]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{getLeagueLabel(option.shortcut, option.label)}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-3">
          <div className="section-kicker">Featured</div>
          <h2 className="font-display text-[2rem] leading-none text-[#101217] sm:text-[2.45rem]">
            Stadium Spotlight
          </h2>

          <article className="overflow-hidden rounded-[1.5rem] border border-[#d8dbe3] bg-[#ffffff] shadow-[0_16px_36px_rgba(10,12,18,0.12)]">
            <div className="featured-banner relative flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-7 sm:py-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white">
                <Trophy className="h-3.5 w-3.5" />
                {getLeagueLabel(data.resolvedLeague, data.activeLeagueLabel)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-white/90">
                <Goal className="h-3.5 w-3.5" />
                Featured Tie
              </span>
            </div>

            <div className="grid gap-3 px-5 py-5 sm:px-7 sm:py-6">
              <h3 className="font-display text-3xl leading-[1.08] text-[#101217] sm:text-[2.35rem]">
                {featuredTitle}
              </h3>
              <p className="text-[0.98rem] text-[#4f525a]">{featuredSummary}</p>

              <div className="flex flex-wrap gap-2 text-sm text-[#30343d]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f3f6] px-3 py-1">
                  <Clock3 className="h-4 w-4" />
                  {featuredKickoff}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f3f6] px-3 py-1">
                  <Flag className="h-4 w-4" />
                  {featuredMatch?.matchIsFinished ? "Final" : "Upcoming"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f3f6] px-3 py-1">
                  <Goal className="h-4 w-4" />
                  {featuredScore}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f3f6] px-3 py-1">
                  <CircleDot className="h-4 w-4" />
                  {featuredMatch ? `${featuredMatch.goals?.length ?? 0} goal events` : "No events yet"}
                </span>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-4">
          <div className="section-kicker">Quick Actions</div>
          <div className="grid gap-3 md:grid-cols-2">
            {actionCards.map((action) => {
              const Icon = action.icon;

              return (
                <a
                  key={action.title}
                  href={action.href}
                  className="frost-card group grid min-h-[132px] gap-3 p-5 transition-colors hover:border-[#d5a2ad] hover:bg-[#fff5f7]"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ffe9ed] text-[#b51128]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="grid gap-1">
                    <div className="text-[1.35rem] font-display leading-none text-[#15171d]">{action.title}</div>
                    <div className="text-sm text-[#4f525a]">{action.description}</div>
                  </div>
                  <div className="inline-flex items-center gap-1 text-sm font-semibold text-[#b51128]">
                    Open
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {data.visibleErrors.length > 0 ? (
          <div className="rounded-2xl border border-[#d9b468] bg-[#fff7dd] px-4 py-3 text-sm text-[#7e5610]">
            Some data failed to load: {data.visibleErrors.join(", ")}. Try refreshing.
          </div>
        ) : null}

        {data.resolvedLeague === "cl" ? (
          <section id="bracket" className="grid gap-4">
            <BracketSection rounds={data.bracketMatches} />
          </section>
        ) : null}

        <section id="matches" className="grid gap-4">
          <div className="grid gap-1">
            <div className="section-kicker">Matchday</div>
            <h2 className="font-display text-[2rem] leading-none text-[#101217] sm:text-[2.45rem]">
              {data.currentGroupName}
            </h2>
            <p className="text-sm text-[#4f525a]">
              {data.activeLeagueLabel} · Season {data.resolvedSeason}
            </p>
          </div>

          <div className="frost-card grid gap-4 p-4 sm:p-6">
            {data.matches.length === 0 ? (
              <div className="rounded-2xl border border-[#d8dae1] bg-[#f2f3f7] p-5 text-[#4c5059]">
                No match results available yet for this round.
              </div>
            ) : (
              data.matches.map((match, index) => (
                <MatchCard key={getMatchKey(match, index)} match={match} />
              ))
            )}

            {data.nextRoundMatches.length > 0 ? (
              <div className="grid gap-3 border-t border-[#dde0e7] pt-4">
                <div className="grid gap-1">
                  <div className="section-kicker">Next Round</div>
                  <div className="text-sm text-[#4f525a]">{data.nextRoundLabel}</div>
                </div>
                {data.nextRoundMatches.map((match, index) => (
                  <MatchCard key={getMatchKey(match, index)} match={match} />
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {data.showInlineTable || data.showSidebarTable ? (
          <section id="table" className="grid gap-4">
            <div className="section-kicker">Standings</div>
            <StandingsCard table={data.table} />
          </section>
        ) : null}
      </main>
    </div>
  );
}
