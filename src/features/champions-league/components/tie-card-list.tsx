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
      <div className="poster-empty rounded-[1.6rem] p-5 text-[#a8bbb2]">
        {emptyText}
      </div>
    );
  }

  return ties.map((tie, tieIndex) => (
    <div
      key={`${keyPrefix}-${tie.key}-${tieIndex}`}
      className="poster-surface grid gap-3 rounded-[1.7rem] border-white/10 bg-[linear-gradient(180deg,rgba(8,25,30,0.92),rgba(7,16,21,0.98))] p-3"
    >
      <div className="grid gap-2 px-1">
        <div
          className={`inline-flex items-center rounded-xl border px-2 py-1 text-sm font-semibold ${
            tie.aggregateScore?.leader === "team1"
              ? "border-[#d8b86a]/30 bg-[rgba(57,45,15,0.72)] text-[#f5edc9]"
              : "border-white/10 bg-white/[0.06] text-[#f2f7f2]"
          }`}
        >
          {tie.team1.teamName ?? "Team 1"}
        </div>
        <div
          className={`inline-flex items-center rounded-xl border px-2 py-1 text-sm font-semibold ${
            tie.aggregateScore?.leader === "team2"
              ? "border-[#d8b86a]/30 bg-[rgba(57,45,15,0.72)] text-[#f5edc9]"
              : "border-white/10 bg-white/[0.06] text-[#f2f7f2]"
          }`}
        >
          {tie.team2.teamName ?? "Team 2"}
        </div>
        {tie.aggregateScore ? (
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#d8b86a]">
            {tie.matches.some((match) => match.matchIsFinished !== true)
              ? "Live-Gesamtstand"
              : "Gesamtstand"}{" "}
            {tie.aggregateScore.team1} - {tie.aggregateScore.team2}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3">
        {tie.matches.map((match, matchIndex) => (
          <div key={getMatchKey(match, matchIndex)} className="grid gap-1">
            {tie.matches.length > 1 ? (
              <div className="px-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[#a8bbb2]">
                Spiel {matchIndex + 1}
              </div>
            ) : null}
            <MatchCard match={match} />
          </div>
        ))}
      </div>
    </div>
  ));
}
