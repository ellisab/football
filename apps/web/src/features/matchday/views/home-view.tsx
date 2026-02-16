import type { CSSProperties } from "react";
import type { ApiMatch } from "@footballleagues/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@footballleagues/ui/card";
import { Separator } from "@footballleagues/ui/separator";
import { BracketSection } from "@/features/champions-league/components/bracket-section";
import { LeagueSelector } from "@/features/leagues/components/league-selector";
import { MatchCard } from "@/features/matchday/components/match-card";
import type { HomeData } from "@/features/matchday/server/types";
import { StandingsCard } from "@/features/standings/components/standings-card";

const getMatchKey = (match: ApiMatch, index: number) => {
  return (
    match.matchID ?? `${match.team1?.teamId ?? "home"}-${match.team2?.teamId ?? "away"}-${index}`
  );
};

export function HomeView({ data }: { data: HomeData }) {
  const themeStyles = {
    "--accent": data.theme.accent,
    "--accent-soft": data.theme.accentSoft,
    "--accent-glow": data.theme.glow,
  } as CSSProperties;

  const isSingleColumnLayout =
    data.resolvedLeague === "bl1" ||
    data.resolvedLeague === "bl2" ||
    data.resolvedLeague === "cl" ||
    data.resolvedLeague === "dfb";

  return (
    <div
      style={themeStyles}
      className="app-shell min-h-screen w-full overflow-x-hidden text-slate-900 dark:text-slate-100"
    >
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-12 pt-8 sm:gap-10 sm:px-8 sm:pb-20 sm:pt-14">
        <section className="grid gap-6">
          <div className="grid gap-4">
            <h1 className="font-display text-3xl uppercase tracking-[0.12em] text-slate-900 dark:text-slate-100 sm:text-5xl sm:tracking-[0.18em] lg:text-6xl">
              Matchday Atlas
            </h1>
            <p className="max-w-2xl text-sm text-slate-700 dark:text-slate-200/80 sm:text-lg">
              Follow the latest matchday results and tables for your favorite leagues,
              refreshed every minute.
            </p>
          </div>
        </section>

        <div className="sticky top-0 z-30 -mx-4 px-4 py-4 sm:-mx-8 sm:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-[0_0_45px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:px-6">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">
              Competition
            </span>
            <LeagueSelector
              leagues={data.leagueOptions}
              currentLeague={data.resolvedLeague}
            />
          </div>
        </div>

        <Separator className="bg-slate-200/80 dark:bg-white/10" />

        {data.visibleErrors.length > 0 ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            Some data failed to load: {data.visibleErrors.join(", ")}. Try refreshing.
          </div>
        ) : null}

        {data.resolvedLeague === "cl" ? (
          <BracketSection rounds={data.bracketMatches} />
        ) : null}

        <section
          className={`grid gap-8 ${isSingleColumnLayout ? "" : "lg:grid-cols-[1.3fr_1fr]"}`}
        >
          <Card className="border-slate-200 bg-white/70 shadow-[0_0_45px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900 dark:text-slate-100 sm:text-2xl">
                {data.currentGroupName}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-200/70">
                {data.activeLeagueLabel} · Season {data.resolvedSeason}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid w-full min-w-0 gap-4">
              {data.matches.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-100/80 p-6 text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
                  No match results available yet for this matchday.
                </div>
              ) : (
                data.matches.map((match, index) => (
                  <MatchCard key={getMatchKey(match, index)} match={match} />
                ))
              )}

              {data.nextRoundMatches.length > 0 ? (
                <div className="grid gap-4 pt-1">
                  <Separator className="bg-slate-200/80 dark:bg-white/10" />
                  <div className="grid gap-1">
                    <div className="text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">
                      {data.nextRoundLabel}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Upcoming fixtures because the current round is finished.
                    </div>
                  </div>
                  {data.nextRoundMatches.map((match, index) => (
                    <MatchCard key={getMatchKey(match, index)} match={match} />
                  ))}
                </div>
              ) : null}

              {data.showInlineTable ? (
                <div className="grid gap-6 pt-2">
                  <StandingsCard table={data.table} />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {data.showSidebarTable ? <StandingsCard table={data.table} /> : null}
          </div>
        </section>
      </main>
    </div>
  );
}
