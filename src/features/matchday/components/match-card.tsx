import { getFinalResult, type ApiMatch } from "@footballleagues/core/openligadb";
import { Clock3, Goal, MapPin } from "lucide-react";
import { TeamBadge } from "@/features/teams/components/team-badge";
import { LocalKickoff } from "./local-kickoff";

type MatchCardProps = {
  match: ApiMatch;
};

const getTeamLabel = (team: ApiMatch["team1"], fallback: string) => {
  return team?.teamName ?? team?.shortName ?? fallback;
};

const getVenueLabel = (match: ApiMatch) => {
  const stadium = match.location?.locationStadium;
  const city = match.location?.locationCity;

  if (stadium && city) return `${stadium}, ${city}`;
  return stadium ?? city;
};

export function MatchCard({ match }: MatchCardProps) {
  const finalResult = getFinalResult(match);
  const score = finalResult
    ? `${finalResult.pointsTeam1 ?? 0} - ${finalResult.pointsTeam2 ?? 0}`
    : "- : -";
  const goals = match.goals ?? [];
  const venue = getVenueLabel(match);

  return (
    <div
      className="poster-surface relative grid min-h-[148px] w-full min-w-0 max-w-full gap-4 overflow-hidden rounded-[1.7rem] border-white/10 bg-[linear-gradient(180deg,rgba(7,27,32,0.92),rgba(8,17,22,0.98))] p-4 text-[#edf6ef]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(220,188,110,0.85),rgba(114,217,228,0.75),transparent)]" />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[#d6e4de]"
        >
          <Clock3 className="h-3.5 w-3.5" />
          <LocalKickoff value={match.matchDateTimeUTC ?? match.matchDateTime} />
        </span>
        <div className="flex flex-wrap justify-end gap-2">
          {venue ? (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[#c8d8d1]">
              <MapPin className="h-3.5 w-3.5 text-[#72d9e4]" />
              <span className="max-w-[22ch] truncate">{venue}</span>
            </span>
          ) : null}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
              match.matchIsFinished
                ? "border-[#dcbc6e]/40 bg-[#463614]/60 text-[#f4ebc2]"
                : "border-[#72d9e4]/30 bg-[#0c2f36]/60 text-[#c6f7fb]"
            }`}
          >
            <Goal className="h-3.5 w-3.5" />
            {match.matchIsFinished ? "Beendet" : "Anstehend"}
          </span>
        </div>
      </div>

      <div className="grid gap-2 text-sm font-semibold">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <TeamBadge
              name={getTeamLabel(match.team1, "TBD")}
              iconUrl={match.team1?.teamIconUrl}
              className="bg-white/10 ring-1 ring-white/10"
            />
            <span className="min-w-0 truncate leading-tight">
              {getTeamLabel(match.team1, "TBD")}
            </span>
          </div>
          <span className="score-pill rounded-full px-4 py-2 text-[1.45rem] leading-none tracking-[0.04em] font-[var(--font-stadium-heading)] text-[#fff6d0] [text-shadow:0_0_24px_rgba(255,214,108,0.32)]">
            {score}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <TeamBadge
            name={getTeamLabel(match.team2, "TBD")}
            iconUrl={match.team2?.teamIconUrl}
            className="bg-white/10 ring-1 ring-white/10"
          />
          <span className="min-w-0 truncate leading-tight">
            {getTeamLabel(match.team2, "TBD")}
          </span>
        </div>
      </div>

      {goals.length > 0 ? (
        <div className="grid gap-1.5 text-xs text-[#c8d8d1]">
          {goals.map((goal, index) => (
            <div
              key={goal.goalID ?? `${goal.goalGetterName}-${goal.matchMinute}-${index}`}
              className="inline-flex items-center gap-1.5"
            >
              <Goal className="h-3.5 w-3.5 text-[#dcbc6e]" />
              {goal.matchMinute ?? "-"}&apos; {goal.goalGetterName ?? "Tor"}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
