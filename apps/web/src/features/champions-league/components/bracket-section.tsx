import type { BracketRound } from "@/features/matchday/server/types";
import { MatchCard } from "@/features/matchday/components/match-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@footballleagues/ui/card";

type BracketSectionProps = {
  rounds: BracketRound[];
};

export function BracketSection({ rounds }: BracketSectionProps) {
  if (rounds.length === 0) return null;

  return (
    <section className="grid gap-6">
      <Card className="border-slate-200 bg-white/70 shadow-[0_0_45px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/5">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900 dark:text-slate-100 sm:text-2xl">
            Champions League Bracket
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-200/70">
            Knockout rounds based on the latest groups data.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {rounds.map(({ group, matches }) => (
            <div key={group.groupID ?? group.groupName} className="grid gap-3">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">
                {group.groupName ?? "Round"}
              </div>
              {matches.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-100/80 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
                  No matches available yet.
                </div>
              ) : (
                matches.map((match) => <MatchCard key={match.matchID} match={match} />)
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
