import Link from "next/link";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import {
  getMatchScore,
  getMatchStatus,
  getMatchStatusLabel,
  getTeamLabel,
  getVenueLabel,
} from "@/features/football/view-utils";
import { Clock3, Goal, MapPin } from "lucide-react";
import { TeamBadge } from "@/features/teams/components/team-badge";
import { LocalKickoff } from "./local-kickoff";

type MatchCardProps = {
  match: ApiMatch;
};

export function MatchCard({ match }: MatchCardProps) {
  const status = getMatchStatus(match);
  const score = getMatchScore(match).replace(":", " - ");
  const goals = match.goals ?? [];
  const venue = getVenueLabel(match);
  const href = match.matchID ? `/matches/${match.matchID}` : "#";

  return (
    <Link
      href={href}
      className="poster-surface group relative grid min-h-[148px] w-full min-w-0 max-w-full gap-4 overflow-hidden rounded-[1.35rem] border-white/10 bg-[linear-gradient(180deg,rgba(7,27,32,0.92),rgba(8,17,22,0.98))] p-4 text-[#f2f7f2] transition-all hover:-translate-y-0.5 hover:border-[#6eeaf2]/35 hover:bg-white/[0.055]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(216, 184, 106,0.85),rgba(110, 234, 242,0.75),transparent)]" />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[#d6e4de]"
        >
          <Clock3 className="h-3.5 w-3.5" />
          <LocalKickoff value={match.matchDateTimeUTC ?? match.matchDateTime} />
        </span>
        <div className="flex flex-wrap justify-end gap-2">
          {venue ? (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[#c7d7d0]">
              <MapPin className="h-3.5 w-3.5 text-[#6eeaf2]" />
              <span className="max-w-[22ch] truncate">{venue}</span>
            </span>
          ) : null}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
              status === "finished"
                ? "border-[#d8b86a]/40 bg-[#273021]/60 text-[#f5edc9]"
                : status === "live"
                  ? "live-chip border-[#6eeaf2]/35 bg-[#07363a]/70 text-[#ddfbff]"
                : "border-[#6eeaf2]/30 bg-[#07363a]/60 text-[#ddfbff]"
            }`}
          >
            <Goal className="h-3.5 w-3.5" />
            {getMatchStatusLabel(match)}
          </span>
        </div>
      </div>

      <div className="grid gap-2 text-sm font-semibold">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <TeamBadge
              name={getTeamLabel(match.team1, "Offen")}
              iconUrl={match.team1?.teamIconUrl}
              className="bg-white/10 ring-1 ring-white/10"
            />
            <span className="min-w-0 truncate leading-tight">
              {getTeamLabel(match.team1, "Offen")}
            </span>
          </div>
          <span className="score-pill rounded-full px-4 py-2 text-[1.45rem] leading-none tracking-[0.04em] font-[var(--font-stadium-heading)] text-[#fff4c2] [text-shadow:0_0_24px_rgba(255,214,108,0.32)]">
            {score}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <TeamBadge
            name={getTeamLabel(match.team2, "Offen")}
            iconUrl={match.team2?.teamIconUrl}
            className="bg-white/10 ring-1 ring-white/10"
          />
          <span className="min-w-0 truncate leading-tight">
            {getTeamLabel(match.team2, "Offen")}
          </span>
        </div>
      </div>

      {goals.length > 0 ? (
        <div className="grid gap-1.5 text-xs text-[#c7d7d0]">
          {goals.map((goal, index) => (
            <div
              key={goal.goalID ?? `${goal.goalGetterName}-${goal.matchMinute}-${index}`}
              className="inline-flex items-center gap-1.5"
            >
              <Goal className="h-3.5 w-3.5 text-[#d8b86a]" />
              {goal.matchMinute ?? "-"}&apos; {goal.goalGetterName ?? "Tor"}
            </div>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
