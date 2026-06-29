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
      className="poster-surface group grid min-h-[15rem] overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#061512]/86 p-4 transition-all hover:-translate-y-0.5 hover:border-[#6eeaf2]/35"
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
            <h2 className="truncate text-xl font-bold text-[#f5edc9]">{team.name}</h2>
            <p className="mt-1 truncate text-sm text-[#a8bbb2]">
              {team.competitions.map((entry) => entry.label).join(" · ")}
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-[#6eeaf2] transition-transform group-hover:translate-x-0.5" />
      </div>

      <div className="mt-5 grid gap-2">
        <div className="rounded-[0.9rem] border border-white/10 bg-white/[0.045] p-3">
          <div className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8fa59c]">
            <CalendarDays className="h-3.5 w-3.5 text-[#6eeaf2]" />
            Nächstes Spiel
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-[#f2f7f2]">
            {next
              ? `${getTeamLabel(next.match.team1, "Offen")} gegen ${getTeamLabel(next.match.team2, "Offen")} · ${formatMatchTime(next.match)}`
              : "Kein kommendes Spiel sichtbar"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[0.9rem] border border-[#d8b86a]/20 bg-[#273021]/35 p-3">
            <div className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#d8b86a]">
              Tabelle
            </div>
            <p className="mt-1 text-sm font-bold text-[#f5edc9]">
              {team.tablePosition
                ? `#${team.tablePosition.position} · ${team.tablePosition.points ?? 0} Pkt.`
                : "Offen"}
            </p>
          </div>
          <div className="rounded-[0.9rem] border border-white/10 bg-white/[0.045] p-3">
            <div className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8fa59c]">
              Zuletzt
            </div>
            <p className="mt-1 text-sm font-bold text-[#f5edc9]">
              {recent ? getMatchScore(recent.match) : "Kein Ergebnis"}
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
      title="Team-Identitäten"
      description="Alle Teams aus den aktuellen Fußball-Daten, sortiert für schnellen Zugriff auf Tabellenplatz, letzte Ergebnisse und das nächste Spiel."
    >
      {teams.length === 0 ? (
        <section className="poster-empty rounded-[1.25rem] p-5 text-sm leading-6 text-[#a8bbb2]">
          Noch sind keine Teamdaten sichtbar.
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
      description="Teamidentität, kommende Spiele, letzte Ergebnisse, Tabellenkontext und eine vorbereitete Kaderfläche für künftige Spielerdaten."
    >
      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="poster-surface relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#061512]/88 p-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#d8b86a,#6eeaf2,#43c886)]" />
          <div className="flex items-center gap-4">
            <TeamBadge
              name={team.name}
              iconUrl={team.iconUrl}
              size={72}
              className="bg-white/10 ring-1 ring-white/10"
            />
            <div>
              <div className="section-kicker">Teamidentität</div>
              <h2 className="mt-2 text-3xl font-bold text-[#f5edc9]">{team.name}</h2>
              <p className="mt-1 text-sm text-[#a8bbb2]">
                {team.competitions.map((entry) => entry.label).join(" · ")}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1rem] border border-[#d8b86a]/20 bg-[#273021]/35 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#d8b86a]">
                <Table2 className="h-4 w-4" />
                Tabellenplatz
              </div>
              <p className="mt-2 text-2xl font-bold text-[#f5edc9]">
                {team.tablePosition
                  ? `#${team.tablePosition.position}`
                  : "Nicht verfügbar"}
              </p>
              {team.tablePosition ? (
                <p className="mt-1 text-sm text-[#a8bbb2]">
                  {team.tablePosition.points ?? 0} Punkte ·{" "}
                  {team.tablePosition.competitionLabel}
                </p>
              ) : null}
            </div>
            <div className="rounded-[1rem] border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8fa59c]">
                <Shirt className="h-4 w-4 text-[#6eeaf2]" />
                Kader
              </div>
              <p className="mt-2 text-sm leading-6 text-[#a8bbb2]">
                Kaderdaten sind für einen künftigen Spielerfeed vorbereitet.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <section className="poster-surface rounded-[1.25rem] border border-white/10 bg-[#061512]/86 p-5">
            <div className="section-kicker">Nächstes Spiel</div>
            <h2 className="mt-2 text-2xl font-bold text-[#f5edc9]">
              {next
                ? `${getTeamLabel(next.match.team1, "Offen")} gegen ${getTeamLabel(next.match.team2, "Offen")}`
                : "Kein kommendes Spiel sichtbar"}
            </h2>
            {next ? (
              <p className="mt-2 text-sm text-[#a8bbb2]">
                {next.competition.leagueLabel} · {formatMatchTime(next.match)} ·{" "}
                {status === "live" ? "Läuft jetzt" : "Anstehend"}
              </p>
            ) : null}
          </section>

          <section className="poster-surface rounded-[1.25rem] border border-white/10 bg-[#061512]/86 p-5">
            <div className="section-kicker">Letztes Ergebnis</div>
            <h2 className="mt-2 text-2xl font-bold text-[#f5edc9]">
              {recent
                ? `${getTeamLabel(recent.match.team1, "Offen")} ${getMatchScore(recent.match)} ${getTeamLabel(recent.match.team2, "Offen")}`
                : "Kein beendetes Ergebnis sichtbar"}
            </h2>
            {recent ? (
              <p className="mt-2 text-sm text-[#a8bbb2]">
                {recent.competition.leagueLabel} · {formatMatchTime(recent.match)}
              </p>
            ) : null}
          </section>
        </div>
      </section>
    </RouteFrame>
  );
}
