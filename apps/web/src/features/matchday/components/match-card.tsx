import type { ApiMatch } from "@footballleagues/core";
import { formatKickoff, getFinalResult } from "@footballleagues/core";
import { Clock3, Goal } from "lucide-react";
import { TeamBadge } from "@/features/teams/components/team-badge";
import type { DesignDirection } from "@/features/matchday/server/types";

type MatchCardProps = {
  match: ApiMatch;
  direction?: DesignDirection;
};

export function MatchCard({ match, direction = "stadium" }: MatchCardProps) {
  const isGazette = direction === "gazette";
  const finalResult = getFinalResult(match);
  const score = finalResult
    ? `${finalResult.pointsTeam1 ?? 0} - ${finalResult.pointsTeam2 ?? 0}`
    : "- : -";
  const goals = match.goals ?? [];

  return (
    <div
      className={`grid min-h-[132px] w-full min-w-0 max-w-full gap-3 overflow-hidden rounded-2xl border p-4 ${
        isGazette
          ? "border-[#e0d8cc] bg-[#fffdf9] text-[#2a2420] shadow-[0_8px_18px_rgba(20,16,12,0.08)]"
          : "border-[#222530] bg-[#13161d] text-[#d6dbe6] shadow-[0_8px_18px_rgba(6,8,12,0.34)]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
            isGazette ? "bg-[#f1ebe1] text-[#6f665a]" : "bg-[#1c212c] text-[#a7b0c3]"
          }`}
        >
          <Clock3 className="h-3.5 w-3.5" />
          {formatKickoff(match.matchDateTimeUTC ?? match.matchDateTime)}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
            match.matchIsFinished
              ? isGazette
                ? "bg-[#efe6d6] text-[#8c6c2c]"
                : "bg-[#1a3a2a] text-[#3dffa0]"
              : isGazette
                ? "bg-[#f1ebe1] text-[#6f665a]"
                : "bg-[#1c212c] text-[#a7b0c3]"
          }`}
        >
          <Goal className="h-3.5 w-3.5" />
          {match.matchIsFinished ? "Final" : "Scheduled"}
        </span>
      </div>

      <div className="grid gap-2 text-sm font-semibold">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <TeamBadge
              name={match.team1?.teamName}
              iconUrl={match.team1?.teamIconUrl}
              className={isGazette ? "bg-[#f1ebe1]" : "bg-[#1e2230]"}
            />
            <span className="min-w-0 truncate leading-tight">
              {match.team1?.teamName ?? "Home"}
            </span>
          </div>
          <span
            className={`text-2xl leading-none tracking-tight ${
              isGazette
                ? "font-[var(--font-gazette-heading)] text-[#1a1612]"
                : "font-[var(--font-stadium-heading)] text-[#3dffa0]"
            }`}
          >
            {score}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <TeamBadge
            name={match.team2?.teamName}
            iconUrl={match.team2?.teamIconUrl}
            className={isGazette ? "bg-[#f1ebe1]" : "bg-[#1e2230]"}
          />
          <span className="min-w-0 truncate leading-tight">
            {match.team2?.teamName ?? "Away"}
          </span>
        </div>
      </div>

      {goals.length > 0 ? (
        <div className={`grid gap-1.5 text-xs ${isGazette ? "text-[#766d61]" : "text-[#9aa2b4]"}`}>
          {goals.map((goal, index) => (
            <div
              key={goal.goalID ?? `${goal.goalGetterName}-${goal.matchMinute}-${index}`}
              className="inline-flex items-center gap-1.5"
            >
              <Goal className={`h-3.5 w-3.5 ${isGazette ? "text-[#8c6c2c]" : "text-[#3dffa0]"}`} />
              {goal.matchMinute ?? "-"}&apos; {goal.goalGetterName ?? "Goal"}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
