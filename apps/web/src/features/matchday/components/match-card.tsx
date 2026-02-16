import type { ApiMatch } from "@footballleagues/core";
import { formatKickoff, getFinalResult } from "@footballleagues/core";
import { TeamBadge } from "@/features/teams/components/team-badge";

type MatchCardProps = {
  match: ApiMatch;
};

export function MatchCard({ match }: MatchCardProps) {
  const finalResult = getFinalResult(match);
  const score = finalResult
    ? `${finalResult.pointsTeam1 ?? 0} - ${finalResult.pointsTeam2 ?? 0}`
    : "-";
  const goals = match.goals ?? [];

  return (
    <div
      className="grid min-h-[132px] w-full min-w-0 max-w-full gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/80 p-4 dark:border-white/10 dark:bg-slate-950/40"
      key={match.matchID ?? `${match.team1?.teamId}-${match.team2?.teamId}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
        <span>{formatKickoff(match.matchDateTimeUTC ?? match.matchDateTime)}</span>
        <span>{match.matchIsFinished ? "Final" : "Scheduled"}</span>
      </div>
      <div className="grid gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <TeamBadge name={match.team1?.teamName} iconUrl={match.team1?.teamIconUrl} />
            <span className="min-w-0 truncate leading-tight">
              {match.team1?.teamName ?? "Home"}
            </span>
          </div>
          <span className="font-display text-base tracking-[0.2em]">{score}</span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <TeamBadge name={match.team2?.teamName} iconUrl={match.team2?.teamIconUrl} />
          <span className="min-w-0 truncate leading-tight">
            {match.team2?.teamName ?? "Away"}
          </span>
        </div>
      </div>
      {goals.length > 0 ? (
        <div className="grid gap-1 text-center text-xs text-slate-600 dark:text-slate-300">
          {goals.map((goal, index) => (
            <div key={goal.goalID ?? `${goal.goalGetterName}-${goal.matchMinute}-${index}`}>
              {goal.matchMinute ?? "-"}&apos; {goal.goalGetterName ?? "Goal"}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
