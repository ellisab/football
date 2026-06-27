import Link from "next/link";
import { CalendarDays, Goal, MapPin, Radio, Table2 } from "lucide-react";
import { TeamBadge } from "@/features/teams/components/team-badge";
import type { CompetitionMatch } from "@/features/football/view-utils";
import {
  formatMatchTime,
  getMatchScore,
  getMatchStatus,
  getMatchStatusLabel,
  getTeamLabel,
  getVenueLabel,
} from "@/features/football/view-utils";
import { getCompetitionMeta } from "@/features/football/competition-meta";
import { RouteFrame } from "./route-frame";

function Timeline({ item }: { item: CompetitionMatch }) {
  const goals = item.match.goals ?? [];
  const status = getMatchStatus(item.match);

  if (goals.length === 0) {
    return (
      <section className="poster-surface rounded-[1.25rem] border border-white/10 bg-[#071416]/86 p-5">
        <div className="section-kicker">Timeline</div>
        <p className="mt-3 text-sm leading-6 text-[#a9c0b6]">
          {status === "upcoming"
            ? "Timeline starts at kickoff."
            : status === "live"
              ? "Match is live. Events will appear here when the feed provides them."
              : "No detailed event feed is available for this match."}
        </p>
      </section>
    );
  }

  return (
    <section className="poster-surface rounded-[1.25rem] border border-white/10 bg-[#071416]/86 p-5">
      <div className="section-kicker">Timeline</div>
      <ol className="mt-5 grid gap-3">
        {goals.map((goal, index) => (
          <li
            key={goal.goalID ?? `${goal.goalGetterName}-${goal.matchMinute}-${index}`}
            className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[0.9rem] border border-white/10 bg-white/[0.045] p-3"
          >
            <span className="font-mono text-sm font-bold text-[#dcbc6e]">
              {goal.matchMinute ?? "-"}'
            </span>
            <span className="min-w-0 truncate text-sm font-semibold text-[#edf6ef]">
              {goal.goalGetterName ?? "Goal"}
              {goal.isPenalty ? " · Penalty" : ""}
              {goal.isOwnGoal ? " · Own goal" : ""}
            </span>
            <span className="rounded-full border border-[#dcbc6e]/25 bg-[#463614]/45 px-3 py-1 font-mono text-sm font-bold text-[#f4efd6]">
              {goal.scoreTeam1 ?? "-"}:{goal.scoreTeam2 ?? "-"}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function MatchDetailView({ item }: { item: CompetitionMatch }) {
  const { competition, match } = item;
  const status = getMatchStatus(match);
  const score = getMatchScore(match);
  const venue = getVenueLabel(match);
  const meta = getCompetitionMeta(competition.resolvedLeague);
  const Icon = meta.icon;
  const tableSection = competition.sections.find(
    (section) => section.renderKind === "table"
  );
  const tableRows = tableSection?.renderKind === "table" ? tableSection.items : [];
  const team1Row = tableRows.find(
    (row) =>
      row.teamInfoId === match.team1?.teamId ||
      row.teamName === match.team1?.teamName
  );
  const team2Row = tableRows.find(
    (row) =>
      row.teamInfoId === match.team2?.teamId ||
      row.teamName === match.team2?.teamName
  );

  return (
    <RouteFrame
      eyebrow={meta.label}
      title={`${getTeamLabel(match.team1, "TBD")} vs ${getTeamLabel(match.team2, "TBD")}`}
      description="A cinematic match control room with score, status, venue, timeline, stats, and table impact."
    >
      <section className="poster-surface relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#071416]/88 p-5 sm:p-7">
        <div
          aria-hidden
          className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${meta.accentClass}`}
        />
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#dcbc6e]">
            <Icon className="h-4 w-4" />
            {competition.leagueLabel} · Saison {competition.resolvedSeason}
          </span>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${
              status === "live"
                ? "live-chip border-[#72d9e4]/35 bg-[#0c2f36]/70 text-[#c6f7fb]"
                : status === "finished"
                  ? "border-[#dcbc6e]/30 bg-[#463614]/45 text-[#f4ebc2]"
                  : "border-white/10 bg-white/[0.045] text-[#a9c0b6]"
            }`}
          >
            {status === "live" ? <Radio className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
            {getMatchStatusLabel(match)}
          </span>
        </div>

        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="grid justify-items-center gap-3 text-center md:justify-items-start md:text-left">
            <TeamBadge
              name={getTeamLabel(match.team1, "TBD")}
              iconUrl={match.team1?.teamIconUrl}
              size={76}
              className="bg-white/10 ring-1 ring-white/10"
            />
            <h2 className="text-2xl font-bold text-[#edf6ef]">
              {getTeamLabel(match.team1, "TBD")}
            </h2>
            {team1Row ? (
              <p className="text-sm text-[#a9c0b6]">
                #{tableRows.indexOf(team1Row) + 1} · {team1Row.points ?? 0} pts
              </p>
            ) : null}
          </div>

          <div className="grid justify-items-center gap-3">
            <span className="score-pill inline-flex min-w-[9rem] justify-center rounded-[1rem] px-6 py-4 text-[3rem] leading-none tracking-[0.04em] font-[var(--font-stadium-heading)] text-[#fff6d0] [text-shadow:0_0_24px_rgba(255,214,108,0.32)]">
              {status === "upcoming" ? formatMatchTime(match) : score}
            </span>
            <p className="text-center text-sm text-[#a9c0b6]">
              {match.group?.groupName ?? "Round open"}
              {venue ? ` · ${venue}` : ""}
            </p>
          </div>

          <div className="grid justify-items-center gap-3 text-center md:justify-items-end md:text-right">
            <TeamBadge
              name={getTeamLabel(match.team2, "TBD")}
              iconUrl={match.team2?.teamIconUrl}
              size={76}
              className="bg-white/10 ring-1 ring-white/10"
            />
            <h2 className="text-2xl font-bold text-[#edf6ef]">
              {getTeamLabel(match.team2, "TBD")}
            </h2>
            {team2Row ? (
              <p className="text-sm text-[#a9c0b6]">
                #{tableRows.indexOf(team2Row) + 1} · {team2Row.points ?? 0} pts
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Timeline item={item} />

        <aside className="grid gap-4">
          <section className="poster-surface rounded-[1.25rem] border border-white/10 bg-[#071416]/86 p-5">
            <div className="section-kicker">Match Facts</div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <span className="inline-flex items-center gap-2 text-[#a9c0b6]">
                  <CalendarDays className="h-4 w-4 text-[#72d9e4]" />
                  Kickoff
                </span>
                <span className="font-semibold text-[#edf6ef]">{formatMatchTime(match)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <span className="inline-flex items-center gap-2 text-[#a9c0b6]">
                  <MapPin className="h-4 w-4 text-[#72d9e4]" />
                  Venue
                </span>
                <span className="max-w-[14rem] truncate text-right font-semibold text-[#edf6ef]">
                  {venue ?? "Open"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[#a9c0b6]">
                  <Goal className="h-4 w-4 text-[#dcbc6e]" />
                  Goals
                </span>
                <span className="font-semibold text-[#edf6ef]">
                  {match.goals?.length ?? 0}
                </span>
              </div>
            </div>
          </section>

          <section className="poster-surface rounded-[1.25rem] border border-white/10 bg-[#071416]/86 p-5">
            <div className="section-kicker">Impact</div>
            <div className="mt-4 grid gap-3">
              <p className="text-sm leading-6 text-[#a9c0b6]">
                {tableRows.length > 0
                  ? "Table context is available for both teams when they appear in the standings."
                  : "Table impact will appear when standings are available for this competition."}
              </p>
              <Link
                href="/tables"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dcbc6e]/25 bg-[#463614]/35 px-4 py-2 text-sm font-bold text-[#f4efd6] transition-colors hover:bg-[#59451b]/45"
              >
                <Table2 className="h-4 w-4" />
                Open tables
              </Link>
            </div>
          </section>

          <section className="poster-surface rounded-[1.25rem] border border-white/10 bg-[#071416]/86 p-5">
            <div className="section-kicker">Stats</div>
            <div className="mt-4 grid gap-3">
              {["Possession", "Shots", "Corners"].map((label) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-[#a9c0b6]">
                    <span>{label}</span>
                    <span>Feed pending</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-1/2 rounded-full bg-[linear-gradient(90deg,#72d9e4,#dcbc6e)] opacity-45" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </RouteFrame>
  );
}
