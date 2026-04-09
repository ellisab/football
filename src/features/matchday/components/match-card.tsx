import { getFinalResult, type ApiMatch } from "@footballleagues/core/openligadb";
import { Clock3, Goal } from "lucide-react";
import { TeamBadge } from "@/features/teams/components/team-badge";
import { LocalKickoff } from "./local-kickoff";

type MatchCardProps = {
  match: ApiMatch;
};

export function MatchCard({ match }: MatchCardProps) {
  const finalResult = getFinalResult(match);
  const score = finalResult
    ? `${finalResult.pointsTeam1 ?? 0} - ${finalResult.pointsTeam2 ?? 0}`
    : "- : -";
  const goals = match.goals ?? [];

  return (
    <div
      className="poster-surface relative grid min-h-[148px] w-full min-w-0 max-w-full gap-4 overflow-hidden rounded-[1.7rem] border-white/10 bg-[linear-gradient(180deg,rgba(42,14,52,0.88),rgba(26,10,35,0.96))] p-4 text-[#ffeef7]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,214,108,0.8),transparent)]" />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[#f5d6e6]"
        >
          <Clock3 className="h-3.5 w-3.5" />
          <LocalKickoff value={match.matchDateTimeUTC ?? match.matchDateTime} />
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
            match.matchIsFinished
              ? "border-[#ffd66c]/40 bg-[#4f3018]/60 text-[#fff0b2]"
              : "border-[#57ebff]/30 bg-[#102838]/60 text-[#bcf7ff]"
          }`}
        >
          <Goal className="h-3.5 w-3.5" />
          {match.matchIsFinished ? "Beendet" : "Anstehend"}
        </span>
      </div>

      <div className="grid gap-2 text-sm font-semibold">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <TeamBadge
              name={match.team1?.teamName}
              iconUrl={match.team1?.teamIconUrl}
              className="bg-white/10 ring-1 ring-white/10"
            />
            <span className="min-w-0 truncate leading-tight">
              {match.team1?.teamName ?? "Heim"}
            </span>
          </div>
          <span className="score-pill rounded-full px-4 py-2 text-[1.45rem] leading-none tracking-[0.04em] font-[var(--font-stadium-heading)] text-[#fff6d0] [text-shadow:0_0_24px_rgba(255,214,108,0.32)]">
            {score}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <TeamBadge
            name={match.team2?.teamName}
            iconUrl={match.team2?.teamIconUrl}
            className="bg-white/10 ring-1 ring-white/10"
          />
          <span className="min-w-0 truncate leading-tight">
            {match.team2?.teamName ?? "Gast"}
          </span>
        </div>
      </div>

      {goals.length > 0 ? (
        <div className="grid gap-1.5 text-xs text-[#f1d4e3]">
          {goals.map((goal, index) => (
            <div
              key={goal.goalID ?? `${goal.goalGetterName}-${goal.matchMinute}-${index}`}
              className="inline-flex items-center gap-1.5"
            >
              <Goal className="h-3.5 w-3.5 text-[#ffd66c]" />
              {goal.matchMinute ?? "-"}&apos; {goal.goalGetterName ?? "Tor"}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
