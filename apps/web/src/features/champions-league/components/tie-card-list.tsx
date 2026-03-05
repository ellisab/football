import type { KnockoutTie } from "@footballleagues/core/matches";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import { MatchCard } from "@/features/matchday/components/match-card";

const getMatchKey = (match: ApiMatch, index: number) => {
  return (
    match.matchID ?? `${match.team1?.teamId ?? "home"}-${match.team2?.teamId ?? "away"}-${index}`
  );
};

export function TieCardList({
  ties,
  keyPrefix,
  emptyText,
}: {
  ties: KnockoutTie[];
  keyPrefix: string;
  emptyText: string;
}) {
  if (ties.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1f2431] bg-[#131720] p-5 text-[#97a2b8]">
        {emptyText}
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
}
