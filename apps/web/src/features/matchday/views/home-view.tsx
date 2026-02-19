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
import type { DesignDirection, HomeData } from "@/features/matchday/server/types";
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

const DIRECTION_COPY: Record<
  DesignDirection,
  {
    title: string;
    kicker: string;
    subtitle: string;
    featuredTitle: string;
    featuredCta: string;
    accent: string;
    accentSoft: string;
  }
> = {
  stadium: {
    title: "Your Match Control",
    kicker: "Live Matchday · 23. Spieltag",
    subtitle:
      "Dark, cinematic, and electric. Built for obsessive fans who want the numbers fast.",
    featuredTitle: "Stadium Spotlight",
    featuredCta: "Jump to table →",
    accent: "#3dffa0",
    accentSoft: "#1a3a2a",
  },
  gazette: {
    title: "Your Matchday Control Room",
    kicker: "23. Spieltag · Season 2025/26",
    subtitle:
      "Warm, editorial, and trustworthy. Magazine pacing with data clarity for every fan.",
    featuredTitle: "Matchday Gazette",
    featuredCta: "View full table →",
    accent: "#e8b84b",
    accentSoft: "#efe6d6",
  },
};

export function HomeView({ data }: { data: HomeData }) {
  const copy = DIRECTION_COPY[data.direction];
  const isGazette = data.direction === "gazette";

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
          ? "Jump straight to qualification and relegation pressure."
          : "Scan upcoming ties and in-round momentum.",
    },
  ];

  const buildHref = (direction: DesignDirection, league = data.resolvedLeague, season = data.resolvedSeason) => {
    return `/?league=${league}&season=${season}&direction=${direction}`;
  };

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden ${
        isGazette
          ? "bg-[radial-gradient(circle_at_10%_0%,#fff3dc_0%,transparent_40%),linear-gradient(180deg,#f7f2e9_0%,#efe8dd_100%)] text-[#1a1612]"
          : "bg-[radial-gradient(circle_at_10%_0%,rgba(61,255,160,0.15)_0%,transparent_35%),linear-gradient(180deg,#0b0d12_0%,#11151e_100%)] text-[#f3f6fd]"
      }`}
    >
      <main className="mx-auto flex w-full max-w-[1220px] flex-col gap-10 px-3 pb-14 pt-5 sm:px-5 sm:pb-20">
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={`text-xs uppercase tracking-[0.2em] ${isGazette ? "text-[#1a3a8f]" : "text-[#3dffa0]"}`}>
                Gunsting Deals — UI Direction
              </p>
              <h1
                className={`text-3xl sm:text-4xl ${
                  isGazette
                    ? "font-[var(--font-gazette-heading)]"
                    : "font-[var(--font-stadium-heading)] uppercase tracking-[0.04em]"
                }`}
              >
                {isGazette ? "Matchday Gazette" : "Stadium Edition"}
              </h1>
            </div>

            <div className="inline-flex rounded-xl border border-white/10 bg-black/10 p-1">
              {(["stadium", "gazette"] as const).map((direction) => {
                const active = data.direction === direction;
                return (
                  <Link
                    key={direction}
                    href={buildHref(direction)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                      active
                        ? isGazette
                          ? "bg-[#1a1612] text-[#f5f1eb]"
                          : "bg-[#3dffa0] text-[#0c0e12]"
                        : isGazette
                          ? "text-[#5f584f] hover:bg-[#ece3d4]"
                          : "text-[#9ea8bb] hover:bg-[#1a202b]"
                    }`}
                  >
                    {direction}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className={`text-[0.7rem] font-semibold uppercase tracking-[0.22em] ${isGazette ? "text-[#1a3a8f]" : "text-[#3dffa0]"}`}>
            Categories
          </div>
          <div className="flex flex-wrap gap-3">
            {data.leagueOptions.map((option) => {
              const isActive = option.shortcut === data.resolvedLeague;
              const Icon = leagueStyles[option.shortcut]?.icon ?? Goal;
              const season = option.seasons[0] ?? data.resolvedSeason;

              return (
                <Link
                  key={option.shortcut}
                  href={buildHref(data.direction, option.shortcut, season)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isGazette
                      ? isActive
                        ? "border-[#e8b84b] bg-[#efe6d6] text-[#1a1612]"
                        : "border-[#e0d8cc] bg-[#fffaf2] text-[#433d35] hover:bg-[#f4ece1]"
                      : isActive
                        ? "border-[#3dffa0] bg-[#1a3a2a] text-[#3dffa0]"
                        : "border-[#232937] bg-[#141922] text-[#a5aec2] hover:border-[#2f3645] hover:bg-[#19202b]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{getLeagueLabel(option.shortcut, option.label)}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section
          className={`relative overflow-hidden rounded-[1.7rem] border px-4 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7 ${
            isGazette
              ? "border-[#3a3428] bg-[#1a1612] text-[#f5f1eb]"
              : "border-[#222530] bg-[linear-gradient(135deg,#0c0e12_0%,#111820_100%)] text-[#ffffff]"
          }`}
        >
          {!isGazette ? (
            <div className="pointer-events-none absolute right-0 top-0 text-[9rem] font-black leading-none text-[#3dffa014] sm:text-[11rem]">
              23
            </div>
          ) : null}

          <div className="relative z-10 grid gap-6">
            <div className="flex flex-wrap gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em]">
              <span
                className={`rounded-full border px-3 py-1 ${
                  isGazette
                    ? "border-[#e8b84b80] bg-[#ffffff12] text-[#e8b84b]"
                    : "border-[#3dffa080] bg-[#1a3a2a] text-[#3dffa0]"
                }`}
              >
                {copy.kicker}
              </span>
              <span className={`rounded-full border px-3 py-1 ${isGazette ? "border-[#d8d0c4] bg-[#ffffff10] text-[#d0c8bc]" : "border-[#2b303b] bg-[#13161d] text-[#9ca6ba]"}`}>
                {getLeagueLabel(data.resolvedLeague, data.activeLeagueLabel)}
              </span>
              <span className={`rounded-full border px-3 py-1 ${isGazette ? "border-[#d8d0c4] bg-[#ffffff10] text-[#d0c8bc]" : "border-[#2b303b] bg-[#13161d] text-[#9ca6ba]"}`}>
                Season {data.resolvedSeason}
              </span>
            </div>

            <div className="grid gap-3">
              <h2
                className={`max-w-3xl text-5xl leading-[0.95] sm:text-6xl lg:text-7xl ${
                  isGazette
                    ? "font-[var(--font-gazette-heading)]"
                    : "font-[var(--font-stadium-heading)] uppercase tracking-[0.04em]"
                }`}
              >
                {copy.title}
              </h2>
              <p className={`max-w-2xl text-sm sm:text-base ${isGazette ? "text-[#8a8278]" : "text-[#9da6b8]"}`}>
                {copy.subtitle}
              </p>
            </div>

            <div
              className={`grid gap-4 rounded-2xl border p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center ${
                isGazette
                  ? "border-[#3a3428] bg-[#242016]"
                  : "border-[#222530] bg-[#13161d]"
              }`}
            >
              <div className="text-center sm:text-left">
                <div className={`text-xs uppercase tracking-[0.1em] ${isGazette ? "text-[#d0c8bc]" : "text-[#9ca6ba]"}`}>
                  Home
                </div>
                <div className="text-lg font-semibold">{featuredMatch?.team1?.teamName ?? "Mainz 05"}</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl ${isGazette ? "font-[var(--font-gazette-heading)] text-[#e8b84b]" : "font-[var(--font-stadium-heading)] text-[#ffffff]"}`}>
                  {featuredResult ? featuredScore : "— : —"}
                </div>
                <div className={`text-xs uppercase tracking-[0.12em] ${isGazette ? "text-[#e8b84b]" : "text-[#3dffa0]"}`}>
                  {featuredKickoff}
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className={`text-xs uppercase tracking-[0.1em] ${isGazette ? "text-[#d0c8bc]" : "text-[#9ca6ba]"}`}>
                  Away
                </div>
                <div className="text-lg font-semibold">{featuredMatch?.team2?.teamName ?? "Hamburger SV"}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3">
          <div className={`text-[0.7rem] font-semibold uppercase tracking-[0.22em] ${isGazette ? "text-[#1a3a8f]" : "text-[#3dffa0]"}`}>
            Featured
          </div>
          <h2
            className={`text-[2rem] leading-none sm:text-[2.45rem] ${
              isGazette
                ? "font-[var(--font-gazette-heading)] text-[#1a1612]"
                : "font-[var(--font-stadium-heading)] uppercase text-[#ffffff]"
            }`}
          >
            {copy.featuredTitle}
          </h2>

          <article
            className={`overflow-hidden rounded-[1.5rem] border ${
              isGazette
                ? "border-[#e0d8cc] bg-[#fffdf9]"
                : "border-[#222530] bg-[#0f141d]"
            }`}
          >
            <div
              className={`relative flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-7 sm:py-6 ${
                isGazette
                  ? "bg-[#1a1612]"
                  : "bg-[linear-gradient(106deg,#101217_0%,#1e2633_46%,#0e1d17_100%)]"
              }`}
            >
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-[0.08em] ${
                  isGazette
                    ? "bg-[#ffffff12] text-[#f5f1eb]"
                    : "bg-[#ffffff12] text-[#e8edf7]"
                }`}
              >
                <Trophy className="h-3.5 w-3.5" />
                {getLeagueLabel(data.resolvedLeague, data.activeLeagueLabel)}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] ${
                  isGazette
                    ? "border-[#e8b84b80] text-[#e8b84b]"
                    : "border-[#3dffa080] text-[#3dffa0]"
                }`}
              >
                <Goal className="h-3.5 w-3.5" />
                Featured Tie
              </span>
            </div>

            <div className="grid gap-3 px-5 py-5 sm:px-7 sm:py-6">
              <h3
                className={`text-3xl leading-[1.08] sm:text-[2.35rem] ${
                  isGazette
                    ? "font-[var(--font-gazette-heading)] text-[#1a1612]"
                    : "font-[var(--font-stadium-heading)] uppercase text-[#ffffff]"
                }`}
              >
                {featuredTitle}
              </h3>
              <p className={`text-[0.98rem] ${isGazette ? "text-[#5f584f]" : "text-[#9ca6ba]"}`}>
                {featuredMatch
                  ? `${data.currentGroupName} in ${data.activeLeagueLabel}. Freshly updated fixtures and results.`
                  : `We're fetching the latest fixtures for ${data.activeLeagueLabel}.`}
              </p>

              <div className="flex flex-wrap gap-2 text-sm">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${
                    isGazette ? "bg-[#f1ebe1] text-[#6f665a]" : "bg-[#1a202b] text-[#a7b0c3]"
                  }`}
                >
                  <Clock3 className="h-4 w-4" />
                  {featuredKickoff}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${
                    isGazette ? "bg-[#f1ebe1] text-[#6f665a]" : "bg-[#1a202b] text-[#a7b0c3]"
                  }`}
                >
                  <Flag className="h-4 w-4" />
                  {featuredMatch?.matchIsFinished ? "Final" : "Upcoming"}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${
                    isGazette ? "bg-[#efe6d6] text-[#8c6c2c]" : "bg-[#1a3a2a] text-[#3dffa0]"
                  }`}
                >
                  <Goal className="h-4 w-4" />
                  {featuredScore}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${
                    isGazette ? "bg-[#f1ebe1] text-[#6f665a]" : "bg-[#1a202b] text-[#a7b0c3]"
                  }`}
                >
                  <CircleDot className="h-4 w-4" />
                  {featuredMatch ? `${featuredMatch.goals?.length ?? 0} goal events` : "No events yet"}
                </span>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-4">
          <div className={`text-[0.7rem] font-semibold uppercase tracking-[0.22em] ${isGazette ? "text-[#1a3a8f]" : "text-[#3dffa0]"}`}>
            Quick Actions
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {actionCards.map((action) => {
              const Icon = action.icon;

              return (
                <a
                  key={action.title}
                  href={action.href}
                  className={`group grid min-h-[132px] gap-3 rounded-2xl border p-5 transition-colors ${
                    isGazette
                      ? "border-[#e0d8cc] bg-[#fffdf9] hover:bg-[#f8f2e9]"
                      : "border-[#222530] bg-[#13161d] hover:bg-[#161b26]"
                  }`}
                >
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                      isGazette ? "bg-[#efe6d6] text-[#8c6c2c]" : "bg-[#1a3a2a] text-[#3dffa0]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="grid gap-1">
                    <div
                      className={`text-[1.35rem] leading-none ${
                        isGazette
                          ? "font-[var(--font-gazette-heading)] text-[#1a1612]"
                          : "font-[var(--font-stadium-heading)] uppercase text-[#ffffff]"
                      }`}
                    >
                      {action.title}
                    </div>
                    <div className={`text-sm ${isGazette ? "text-[#5f584f]" : "text-[#9ca6ba]"}`}>{action.description}</div>
                  </div>
                  <div className={`inline-flex items-center gap-1 text-sm font-semibold ${isGazette ? "text-[#8c6c2c]" : "text-[#3dffa0]"}`}>
                    {copy.featuredCta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {data.visibleErrors.length > 0 ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              isGazette
                ? "border-[#dcc8a0] bg-[#fff5e4] text-[#8c6c2c]"
                : "border-[#2d553f] bg-[#13241d] text-[#9ad8b6]"
            }`}
          >
            Some data failed to load: {data.visibleErrors.join(", ")}. Try refreshing.
          </div>
        ) : null}

        {data.resolvedLeague === "cl" ? (
          <section id="bracket" className="grid gap-4">
            <BracketSection rounds={data.bracketMatches} direction={data.direction} />
          </section>
        ) : null}

        <section id="matches" className="grid gap-4">
          <div className="grid gap-1">
            <div className={`text-[0.7rem] font-semibold uppercase tracking-[0.22em] ${isGazette ? "text-[#1a3a8f]" : "text-[#3dffa0]"}`}>
              Matchday
            </div>
            <h2
              className={`text-[2rem] leading-none sm:text-[2.45rem] ${
                isGazette
                  ? "font-[var(--font-gazette-heading)] text-[#1a1612]"
                  : "font-[var(--font-stadium-heading)] uppercase text-[#ffffff]"
              }`}
            >
              {data.currentGroupName}
            </h2>
            <p className={`text-sm ${isGazette ? "text-[#5f584f]" : "text-[#9ca6ba]"}`}>
              {data.activeLeagueLabel} · Season {data.resolvedSeason}
            </p>
          </div>

          <div
            className={`grid gap-4 rounded-2xl border p-4 sm:p-6 ${
              isGazette
                ? "border-[#e0d8cc] bg-[#f8f2e9]"
                : "border-[#222530] bg-[#0c0f16]"
            }`}
          >
            {data.matches.length === 0 ? (
              <div
                className={`rounded-2xl border p-5 ${
                  isGazette
                    ? "border-[#e0d8cc] bg-[#fffdf9] text-[#6b6257]"
                    : "border-[#1f2431] bg-[#131720] text-[#97a2b8]"
                }`}
              >
                No match results available yet for this round.
              </div>
            ) : (
              data.matches.map((match, index) => (
                <MatchCard key={getMatchKey(match, index)} match={match} direction={data.direction} />
              ))
            )}

            {data.nextRoundMatches.length > 0 ? (
              <div className={`grid gap-3 border-t pt-4 ${isGazette ? "border-[#e0d8cc]" : "border-[#1f2431]"}`}>
                <div className="grid gap-1">
                  <div className={`text-[0.7rem] font-semibold uppercase tracking-[0.22em] ${isGazette ? "text-[#1a3a8f]" : "text-[#3dffa0]"}`}>
                    Next Round
                  </div>
                  <div className={`text-sm ${isGazette ? "text-[#5f584f]" : "text-[#9ca6ba]"}`}>{data.nextRoundLabel}</div>
                </div>
                {data.nextRoundMatches.map((match, index) => (
                  <MatchCard key={getMatchKey(match, index)} match={match} direction={data.direction} />
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {data.showInlineTable || data.showSidebarTable ? (
          <section id="table" className="grid gap-4">
            <div className={`text-[0.7rem] font-semibold uppercase tracking-[0.22em] ${isGazette ? "text-[#1a3a8f]" : "text-[#3dffa0]"}`}>
              Standings
            </div>
            <StandingsCard table={data.table} direction={data.direction} />
          </section>
        ) : null}
      </main>
    </div>
  );
}
