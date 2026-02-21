import { Trophy } from "lucide-react";
import { MatchCard } from "@/features/matchday/components/match-card";
import type { BracketRound } from "@/features/matchday/server/types";

type BracketSectionProps = {
  rounds: BracketRound[];
};

export function BracketSection({ rounds }: BracketSectionProps) {
  if (rounds.length === 0) return null;

  return (
    <section className="grid gap-5">
      <div className="grid gap-2">
        <h2 className="text-[1.85rem] leading-none font-[var(--font-stadium-heading)] uppercase text-[#ffffff] sm:text-[2.2rem]">
          <span className="inline-flex items-center gap-2">
            <Trophy className="h-6 w-6 text-[#3dffa0]" />
            Champions League Bracket
          </span>
        </h2>
        <p className="text-sm text-[#9ca6ba]">
          Knockout rounds based on the latest groups data.
        </p>
      </div>

      {rounds.map(({ group, matches }) => (
        <div key={group.groupID ?? group.groupName} className="grid gap-3">
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#3dffa0]">
            {group.groupName ?? "Round"}
          </div>

          {matches.length === 0 ? (
            <div className="rounded-2xl border border-[#222530] bg-[#151a22] p-4 text-sm text-[#9ca6ba]">
              No matches available yet.
            </div>
          ) : (
            matches.map((match) => (
              <MatchCard key={match.matchID} match={match} />
            ))
          )}
        </div>
      ))}
    </section>
  );
}
