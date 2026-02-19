import { Trophy } from "lucide-react";
import { MatchCard } from "@/features/matchday/components/match-card";
import type { DesignDirection } from "@/features/matchday/server/types";
import type { BracketRound } from "@/features/matchday/server/types";

type BracketSectionProps = {
  rounds: BracketRound[];
  direction?: DesignDirection;
};

export function BracketSection({ rounds, direction = "stadium" }: BracketSectionProps) {
  const isGazette = direction === "gazette";

  if (rounds.length === 0) return null;

  return (
    <section className="grid gap-5">
      <div className="grid gap-2">
        <h2
          className={`text-[1.85rem] leading-none sm:text-[2.2rem] ${
            isGazette
              ? "font-[var(--font-gazette-heading)] text-[#1a1612]"
              : "font-[var(--font-stadium-heading)] uppercase text-[#ffffff]"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Trophy className={`h-6 w-6 ${isGazette ? "text-[#8c6c2c]" : "text-[#3dffa0]"}`} />
            Champions League Bracket
          </span>
        </h2>
        <p className={`text-sm ${isGazette ? "text-[#6b6257]" : "text-[#9ca6ba]"}`}>
          Knockout rounds based on the latest groups data.
        </p>
      </div>

      {rounds.map(({ group, matches }) => (
        <div key={group.groupID ?? group.groupName} className="grid gap-3">
          <div
            className={`text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${
              isGazette ? "text-[#1a3a8f]" : "text-[#3dffa0]"
            }`}
          >
            {group.groupName ?? "Round"}
          </div>

          {matches.length === 0 ? (
            <div
              className={`rounded-2xl border p-4 text-sm ${
                isGazette
                  ? "border-[#e8dfd3] bg-[#f6f0e7] text-[#6f665a]"
                  : "border-[#222530] bg-[#151a22] text-[#9ca6ba]"
              }`}
            >
              No matches available yet.
            </div>
          ) : (
            matches.map((match) => (
              <MatchCard key={match.matchID} match={match} direction={direction} />
            ))
          )}
        </div>
      ))}
    </section>
  );
}
