import Link from "next/link";
import { ArrowRight, CalendarDays, Shirt, Table2 } from "lucide-react";
import { TeamBadge } from "@/features/teams/components/team-badge";
import type { TeamSummary } from "@/features/football/view-utils";
import {
  formatMatchTime,
  getMatchScore,
  getMatchStatus,
  getTeamLabel,
} from "@/features/football/view-utils";
import { RouteFrame } from "./route-frame";

function TeamCard({ team }: { team: TeamSummary }) {
  const next = team.nextMatch;
  const recent = team.recentMatch;

  return (
    <Link
      href={`/teams/${team.id}`}
      className="poster-surface group grid min-h-[15rem] overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#071416]/86 p-4 transition-all hover:-translate-y-0.5 hover:border-[#72d9e4]/35"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <TeamBadge
            name={team.name}
            iconUrl={team.iconUrl}
            size={46}
            className="bg-white/10 ring-1 ring-white/10"
          />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-[#f4efd6]">{team.name}</h2>
            <p className="mt-1 truncate text-sm text-[#a9c0b6]">
              {team.competitions.map((entry) => entry.label).join(" · ")}
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-[#72d9e4] transition-transform group-hover:translate-x-0.5" />
      </div>

      <div className="mt-5 grid gap-2">
        <div className="rounded-[0.9rem] border border-white/10 bg-white/[0.045] p-3">
          <div className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#9fb6ad]">
            <CalendarDays className="h-3.5 w-3.5 text-[#72d9e4]" />
            Next match
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-[#edf6ef]">
            {next
              ? `${getTeamLabel(next.match.team1, "TBD")} vs ${getTeamLabel(next.match.team2, "TBD")} · ${formatMatchTime(next.match)}`
              : "No upcoming match visible"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[0.9rem] border border-[#dcbc6e]/20 bg-[#463614]/35 p-3">
            <div className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#dcbc6e]">
              Table
            </div>
            <p className="mt-1 text-sm font-bold text-[#f4efd6]">
              {team.tablePosition
                ? `#${team.tablePosition.position} · ${team.tablePosition.points ?? 0} pts`
                : "Open"}
            </p>
          </div>
          <div className="rounded-[0.9rem] border border-white/10 bg-white/[0.045] p-3">
            <div className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#9fb6ad]">
              Recent
            </div>
            <p className="mt-1 text-sm font-bold text-[#f4efd6]">
              {recent ? getMatchScore(recent.match) : "No result"}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function TeamsView({ teams }: { teams: TeamSummary[] }) {
  return (
    <RouteFrame
      eyebrow="Teams"
      title="Club Identity Grid"
      description="Every team visible in the current football data, organized for quick access to table position, recent results, and the next match."
    >
      {teams.length === 0 ? (
        <section className="poster-empty rounded-[1.25rem] p-5 text-sm leading-6 text-[#a9c0b6]">
          No team data is visible yet.
        </section>
      ) : (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </section>
      )}
    </RouteFrame>
  );
}

export function TeamDetailView({ team }: { team: TeamSummary }) {
  const next = team.nextMatch;
  const recent = team.recentMatch;
  const status = next ? getMatchStatus(next.match) : undefined;

  return (
    <RouteFrame
      eyebrow={team.competitions[0]?.label ?? "Team"}
      title={team.name}
      description="Team identity, upcoming matches, recent results, table context, and a prepared squad surface for future player data."
    >
      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="poster-surface relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#071416]/88 p-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#dcbc6e,#72d9e4,#43c886)]" />
          <div className="flex items-center gap-4">
            <TeamBadge
              name={team.name}
              iconUrl={team.iconUrl}
              size={72}
              className="bg-white/10 ring-1 ring-white/10"
            />
            <div>
              <div className="section-kicker">Team Identity</div>
              <h2 className="mt-2 text-3xl font-bold text-[#f4efd6]">{team.name}</h2>
              <p className="mt-1 text-sm text-[#a9c0b6]">
                {team.competitions.map((entry) => entry.label).join(" · ")}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1rem] border border-[#dcbc6e]/20 bg-[#463614]/35 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#dcbc6e]">
                <Table2 className="h-4 w-4" />
                Table position
              </div>
              <p className="mt-2 text-2xl font-bold text-[#f4efd6]">
                {team.tablePosition
                  ? `#${team.tablePosition.position}`
                  : "Not available"}
              </p>
              {team.tablePosition ? (
                <p className="mt-1 text-sm text-[#a9c0b6]">
                  {team.tablePosition.points ?? 0} points ·{" "}
                  {team.tablePosition.competitionLabel}
                </p>
              ) : null}
            </div>
            <div className="rounded-[1rem] border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#9fb6ad]">
                <Shirt className="h-4 w-4 text-[#72d9e4]" />
                Squad
              </div>
              <p className="mt-2 text-sm leading-6 text-[#a9c0b6]">
                Squad data is ready for a future player feed.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <section className="poster-surface rounded-[1.25rem] border border-white/10 bg-[#071416]/86 p-5">
            <div className="section-kicker">Next Match</div>
            <h2 className="mt-2 text-2xl font-bold text-[#f4efd6]">
              {next
                ? `${getTeamLabel(next.match.team1, "TBD")} vs ${getTeamLabel(next.match.team2, "TBD")}`
                : "No upcoming match visible"}
            </h2>
            {next ? (
              <p className="mt-2 text-sm text-[#a9c0b6]">
                {next.competition.leagueLabel} · {formatMatchTime(next.match)} ·{" "}
                {status === "live" ? "Live now" : "Upcoming"}
              </p>
            ) : null}
          </section>

          <section className="poster-surface rounded-[1.25rem] border border-white/10 bg-[#071416]/86 p-5">
            <div className="section-kicker">Recent Result</div>
            <h2 className="mt-2 text-2xl font-bold text-[#f4efd6]">
              {recent
                ? `${getTeamLabel(recent.match.team1, "TBD")} ${getMatchScore(recent.match)} ${getTeamLabel(recent.match.team2, "TBD")}`
                : "No finished result visible"}
            </h2>
            {recent ? (
              <p className="mt-2 text-sm text-[#a9c0b6]">
                {recent.competition.leagueLabel} · {formatMatchTime(recent.match)}
              </p>
            ) : null}
          </section>
        </div>
      </section>
    </RouteFrame>
  );
}
