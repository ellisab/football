import type { ApiMatch } from "@footballleagues/core";
import { formatKickoff, getFinalResult } from "@footballleagues/core";
import { Clock3, Goal } from "lucide-react";
import { TeamBadge } from "@/features/teams/components/team-badge";

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
    <div className="grid min-h-[132px] w-full min-w-0 max-w-full gap-3 overflow-hidden rounded-2xl border border-[#d9dce4] bg-[#ffffff] p-4 shadow-[0_8px_18px_rgba(12,14,20,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f3f7] px-2.5 py-1 text-[#4f5460]">
          <Clock3 className="h-3.5 w-3.5" />
          {formatKickoff(match.matchDateTimeUTC ?? match.matchDateTime)}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
            match.matchIsFinished
              ? "bg-[#ffe8ed] text-[#9b1028]"
              : "bg-[#f2f3f7] text-[#575d68]"
          }`}
        >
          <Goal className="h-3.5 w-3.5" />
          {match.matchIsFinished ? "Final" : "Scheduled"}
        </span>
      </div>

      <div className="grid gap-2 text-sm font-semibold text-[#171a21]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <TeamBadge name={match.team1?.teamName} iconUrl={match.team1?.teamIconUrl} />
            <span className="min-w-0 truncate leading-tight">
              {match.team1?.teamName ?? "Home"}
            </span>
          </div>
          <span className="font-display text-2xl leading-none tracking-tight text-[#b30f27]">{score}</span>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <TeamBadge name={match.team2?.teamName} iconUrl={match.team2?.teamIconUrl} />
          <span className="min-w-0 truncate leading-tight">
            {match.team2?.teamName ?? "Away"}
          </span>
        </div>
      </div>

      {goals.length > 0 ? (
        <div className="grid gap-1.5 text-xs text-[#535761]">
          {goals.map((goal, index) => (
            <div
              key={goal.goalID ?? `${goal.goalGetterName}-${goal.matchMinute}-${index}`}
              className="inline-flex items-center gap-1.5"
            >
              <Goal className="h-3.5 w-3.5 text-[#bf122a]" />
              {goal.matchMinute ?? "-"}&apos; {goal.goalGetterName ?? "Goal"}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
