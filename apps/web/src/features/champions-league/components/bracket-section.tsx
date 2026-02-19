import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@footballleagues/ui/card";
import { Trophy } from "lucide-react";
import { MatchCard } from "@/features/matchday/components/match-card";
import type { BracketRound } from "@/features/matchday/server/types";

type BracketSectionProps = {
  rounds: BracketRound[];
};

export function BracketSection({ rounds }: BracketSectionProps) {
  if (rounds.length === 0) return null;

  return (
    <section className="grid gap-6">
      <Card className="frost-card gap-0 overflow-hidden border-[#d8dbe3] bg-[#ffffff] py-0 shadow-none">
        <CardHeader className="border-b border-[#e0e2e9] py-5">
          <CardTitle className="font-display text-[1.85rem] leading-none text-[#111319] sm:text-[2.2rem]">
            <span className="inline-flex items-center gap-2">
              <Trophy className="h-6 w-6 text-[#b51129]" />
              Champions League Bracket
            </span>
          </CardTitle>
          <CardDescription className="text-[#4f525a]">
            Knockout rounds based on the latest groups data.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5 py-5">
          {rounds.map(({ group, matches }) => (
            <div key={group.groupID ?? group.groupName} className="grid gap-3">
              <div className="section-kicker">{group.groupName ?? "Round"}</div>

              {matches.length === 0 ? (
                <div className="rounded-2xl border border-[#d8dbe2] bg-[#f2f3f7] p-4 text-sm text-[#4f535b]">
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
