import Link from "next/link";
import type { LeagueKey } from "@footballleagues/core/leagues";
import { groupKnockoutMatchesByTie } from "@footballleagues/core/matches";
import { getFinalResult, type ApiMatch } from "@footballleagues/core/openligadb";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Flag,
  Goal,
  Medal,
  ScanEye,
  Shirt,
  Shield,
  Trophy,
} from "lucide-react";
import { BracketSection } from "@/features/champions-league/components/bracket-section";
import { LocalKickoff } from "@/features/matchday/components/local-kickoff";
import { MatchCard } from "@/features/matchday/components/match-card";
import type { HomeData } from "@/features/matchday/server/types";
import { StandingsCard } from "@/features/standings/components/standings-card";

const getMatchKey = (match: ApiMatch, index: number) => {
  return (
    match.matchID ?? `${match.team1?.teamId ?? "home"}-${match.team2?.teamId ?? "away"}-${index}`
  );
};

const renderGroupedTieCards = (
  matches: ApiMatch[],
  keyPrefix: string
) => {
  const ties = groupKnockoutMatchesByTie(matches);

  if (ties.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1f2431] bg-[#131720] p-5 text-[#97a2b8]">
        No match results available yet for this round.
      </div>
    );
  }

  return ties.map((tie, tieIndex) => (
    <div
      key={`${keyPrefix}-${tie.key}-${tieIndex}`}
      className="grid gap-3 rounded-2xl border border-[#222530] bg-[#151a22] p-3"
    >
      <div className="grid gap-2 px-1">
        <div
          className={`inline-flex items-center rounded-lg border px-2 py-1 text-sm font-semibold ${
            tie.aggregateScore?.leader === "team1"
              ? "border-[#6f3041] bg-[#3b1f29] text-[#ffb3c7]"
              : "border-[#2a3040] bg-[#171c26] text-[#d6dbe6]"
          }`}
        >
          {tie.team1.teamName ?? "Team 1"}
        </div>
        <div
          className={`inline-flex items-center rounded-lg border px-2 py-1 text-sm font-semibold ${
            tie.aggregateScore?.leader === "team2"
              ? "border-[#6f3041] bg-[#3b1f29] text-[#ffb3c7]"
              : "border-[#2a3040] bg-[#171c26] text-[#d6dbe6]"
          }`}
        >
          {tie.team2.teamName ?? "Team 2"}
        </div>
        {tie.aggregateScore ? (
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#3dffa0]">
            {tie.matches.some((match) => match.matchIsFinished !== true) ? "Live Agg" : "Agg"}{" "}
            {tie.aggregateScore.team1} - {tie.aggregateScore.team2}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3">
        {tie.matches.map((match, matchIndex) => (
          <div key={getMatchKey(match, matchIndex)} className="grid gap-1">
            {tie.matches.length > 1 ? (
              <div className="px-1 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[#9ca6ba]">
                Leg {matchIndex + 1}
              </div>
            ) : null}
            <MatchCard match={match} />
          </div>
        ))}
      </div>
    </div>
  ));
};

const leagueStyles: Record<LeagueKey, { label: string; icon: LucideIcon }> = {
  bl1: { label: "Bundesliga", icon: Goal },
  bl2: { label: "2. Bundesliga", icon: Shirt },
  fbl1: { label: "Frauen-Bundesliga", icon: Shield },
  fbl2: { label: "2. Frauen-Bundesliga", icon: Shirt },
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

const MATCHDAY_REGEX = /(\d{1,2})\.\s*spieltag/i;

const getMatchdayNumber = (groupName: string) => {
  return groupName.match(MATCHDAY_REGEX)?.[1] ?? null;
};

const getStageLabel = (groupName: string) => {
  const normalized = groupName.trim();
  if (!normalized) return "Matchday";

  const matchdayNumber = getMatchdayNumber(normalized);
  if (matchdayNumber) return `${matchdayNumber}. Spieltag`;

  return normalized;
};

export function HomeView({ data }: { data: HomeData }) {
  const isChampionsLeaguePlayoffRound =
    data.resolvedLeague === "cl" &&
    /playoffs?/i.test(data.currentGroupName) &&
    data.bracketMatches.some((round) => /playoffs?/i.test(round.group.groupName ?? ""));
  const stageLabel = getStageLabel(data.currentGroupName);
  const matchdayNumber = getMatchdayNumber(data.currentGroupName);
  const heroKicker = matchdayNumber
    ? `Live Matchday · ${matchdayNumber}. Spieltag`
    : `Live ${stageLabel}`;

  const featuredMatch = data.matches[0] ?? data.nextRoundMatches[0];
  const featuredResult = featuredMatch ? getFinalResult(featuredMatch) : null;
  const featuredScore = featuredResult
    ? `${featuredResult.pointsTeam1 ?? 0} - ${featuredResult.pointsTeam2 ?? 0}`
    : "Score pending";

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

  const buildHref = (league = data.resolvedLeague, season = data.resolvedSeason) => {
    return `/?league=${league}&season=${season}`;
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_10%_0%,rgba(61,255,160,0.15)_0%,transparent_35%),linear-gradient(180deg,#0b0d12_0%,#11151e_100%)] text-[#f3f6fd]">
      <main className="mx-auto flex w-full max-w-[1220px] flex-col gap-10 px-3 pb-14 pt-5 sm:px-5 sm:pb-20">
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-[var(--font-stadium-heading)] uppercase tracking-[0.04em] sm:text-4xl">
                Stadium Edition
              </h1>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#3dffa0]">
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
                  href={buildHref(option.shortcut, season)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
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

        <section className="relative overflow-hidden px-4 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7">
          {matchdayNumber ? (
            <div className="pointer-events-none absolute right-0 top-0 text-[9rem] font-black leading-none text-[#3dffa014] sm:text-[11rem]">
              {matchdayNumber}
            </div>
          ) : null}

          <div className="relative z-10 grid gap-6">
            <div className="flex flex-wrap gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em]">
              <span className="rounded-full border border-[#3dffa080] bg-[#1a3a2a] px-3 py-1 text-[#3dffa0]">
                {heroKicker}
              </span>
              <span className="rounded-full border border-[#2b303b] bg-[#13161d] px-3 py-1 text-[#9ca6ba]">
                {getLeagueLabel(data.resolvedLeague, data.activeLeagueLabel)}
              </span>
              <span className="rounded-full border border-[#2b303b] bg-[#13161d] px-3 py-1 text-[#9ca6ba]">
                Season {data.resolvedSeason}
              </span>
            </div>

            <div className="grid gap-3">
              <h2 className="max-w-3xl text-5xl leading-[0.95] font-[var(--font-stadium-heading)] uppercase tracking-[0.04em] sm:text-6xl lg:text-7xl">
                Your Match Control
              </h2>
            </div>

            <div className="grid gap-4 rounded-2xl border border-[#222530] bg-[#13161d] p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="text-center sm:text-left">
                <div className="text-xs uppercase tracking-[0.1em] text-[#9ca6ba]">Home</div>
                <div className="text-lg font-semibold">{featuredMatch?.team1?.teamName ?? "Mainz 05"}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-[var(--font-stadium-heading)] text-[#ffffff]">
                  {featuredResult ? featuredScore : "- : -"}
                </div>
                <div className="text-xs uppercase tracking-[0.12em] text-[#3dffa0]">
                  <LocalKickoff
                    value={featuredMatch?.matchDateTimeUTC ?? featuredMatch?.matchDateTime}
                    fallback="Awaiting kickoff"
                  />
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-xs uppercase tracking-[0.1em] text-[#9ca6ba]">Away</div>
                <div className="text-lg font-semibold">{featuredMatch?.team2?.teamName ?? "Hamburger SV"}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3">
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#3dffa0]">
            Quick Actions
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {actionCards.map((action) => {
              const Icon = action.icon;

              return (
                <a
                  key={action.title}
                  href={action.href}
                  className="group grid min-h-[132px] gap-3 rounded-2xl border border-[#222530] bg-[#13161d] p-5 transition-colors hover:bg-[#161b26]"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1a3a2a] text-[#3dffa0]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="grid gap-1">
                    <div className="text-[1.35rem] leading-none font-[var(--font-stadium-heading)] uppercase text-[#ffffff]">
                      {action.title}
                    </div>
                    <div className="text-sm text-[#9ca6ba]">{action.description}</div>
                  </div>
                  <div className="inline-flex items-center gap-1 text-sm font-semibold text-[#3dffa0]">
                    Jump to table
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {data.visibleErrors.length > 0 ? (
          <div className="rounded-2xl border border-[#2d553f] bg-[#13241d] px-4 py-3 text-sm text-[#9ad8b6]">
            Some data failed to load: {data.visibleErrors.join(", ")}. Try refreshing.
          </div>
        ) : null}

        {data.nextRoundMatches.length > 0 ? (
          <section id="next-round" className="grid gap-4">
            <div className="grid gap-1">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#3dffa0]">
                Next Round
              </div>
              <h2 className="text-[2rem] leading-none font-[var(--font-stadium-heading)] uppercase text-[#ffffff] sm:text-[2.45rem]">
                {data.nextRoundLabel}
              </h2>
              <p className="text-sm text-[#9ca6ba]">
                {data.activeLeagueLabel} · Season {data.resolvedSeason}
              </p>
            </div>

            <div className="grid gap-4">
              {data.resolvedLeague === "cl"
                ? renderGroupedTieCards(data.nextRoundMatches, "next")
                : data.nextRoundMatches.map((match, index) => (
                    <MatchCard key={getMatchKey(match, index)} match={match} />
                  ))}
            </div>
          </section>
        ) : null}

        {data.resolvedLeague === "cl" ? (
          <section id="bracket" className="grid gap-4">
            <BracketSection rounds={data.bracketMatches} />
          </section>
        ) : null}

        {!isChampionsLeaguePlayoffRound ? (
          <section id="matches" className="grid gap-4">
            <div className="grid gap-1">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#3dffa0]">
                Matchday
              </div>
              <h2 className="text-[2rem] leading-none font-[var(--font-stadium-heading)] uppercase text-[#ffffff] sm:text-[2.45rem]">
                {data.currentGroupName}
              </h2>
              <p className="text-sm text-[#9ca6ba]">
                {data.activeLeagueLabel} · Season {data.resolvedSeason}
              </p>
            </div>

            <div className="grid gap-4">
              {data.resolvedLeague === "cl" ? (
                renderGroupedTieCards(data.matches, "current")
              ) : (
                data.matches.length === 0 ? (
                  <div className="rounded-2xl border border-[#1f2431] bg-[#131720] p-5 text-[#97a2b8]">
                    No match results available yet for this round.
                  </div>
                ) : (
                  data.matches.map((match, index) => (
                    <MatchCard key={getMatchKey(match, index)} match={match} />
                  ))
                )
              )}
            </div>
          </section>
        ) : null}

        {data.showInlineTable || data.showSidebarTable ? (
          <section id="table" className="grid w-full min-w-0 gap-4">
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#3dffa0]">
              Standings
            </div>
            <StandingsCard table={data.table} />
          </section>
        ) : null}

        <footer className="mt-2 border-t border-[#1f2431] pt-4 text-xs text-[#8e97ab]">
          Data source:{" "}
          <a
            href="https://www.openligadb.de/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[#3dffa0] underline underline-offset-2 hover:text-[#72ffbc]"
          >
            OpenLigaDB
          </a>
          {" "}· License:{" "}
          <a
            href="https://www.openligadb.de/lizenz"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[#3dffa0] underline underline-offset-2 hover:text-[#72ffbc]"
          >
            openligadb.de/lizenz
          </a>
        </footer>
      </main>
    </div>
  );
}
