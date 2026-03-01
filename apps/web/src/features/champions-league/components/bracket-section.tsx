import { Trophy } from "lucide-react";
import { groupKnockoutMatchesByTie } from "@footballleagues/core/matches";
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

      {rounds.map(({ group, matches }) => {
        const ties = groupKnockoutMatchesByTie(matches);

        return (
        <div key={group.groupID ?? group.groupName} className="grid gap-3">
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#3dffa0]">
            {group.groupName ?? "Round"}
          </div>

          {ties.length === 0 ? (
            <div className="rounded-2xl border border-[#222530] bg-[#151a22] p-4 text-sm text-[#9ca6ba]">
              No matches available yet.
            </div>
          ) : (
            ties.map((tie) => (
              <div
                key={tie.key}
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
                  {tie.matches.map((match, index) => (
                    <div key={match.matchID ?? `${tie.key}-${index}`} className="grid gap-1">
                      {tie.matches.length > 1 ? (
                        <div className="px-1 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[#9ca6ba]">
                          Leg {index + 1}
                        </div>
                      ) : null}
                      <MatchCard match={match} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )})}
    </section>
  );
}
