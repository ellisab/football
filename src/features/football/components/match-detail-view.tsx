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
      <section className="poster-surface rounded-[1.25rem] border border-white/10 bg-[#061512]/86 p-5">
        <div className="section-kicker">Spielverlauf</div>
        <p className="mt-3 text-sm leading-6 text-[#a8bbb2]">
          {status === "upcoming"
            ? "Der Spielverlauf startet mit dem Anstoß."
            : status === "live"
              ? "Das Spiel läuft. Ereignisse erscheinen hier, sobald der Feed sie liefert."
              : "Für dieses Spiel ist kein detaillierter Ereignisfeed verfügbar."}
        </p>
      </section>
    );
  }

  return (
    <section className="poster-surface rounded-[1.25rem] border border-white/10 bg-[#061512]/86 p-5">
      <div className="section-kicker">Spielverlauf</div>
      <ol className="mt-5 grid gap-3">
        {goals.map((goal, index) => (
          <li
            key={goal.goalID ?? `${goal.goalGetterName}-${goal.matchMinute}-${index}`}
            className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[0.9rem] border border-white/10 bg-white/[0.045] p-3"
          >
            <span className="font-mono text-sm font-bold text-[#d8b86a]">
              {goal.matchMinute ?? "-"}'
            </span>
            <span className="min-w-0 truncate text-sm font-semibold text-[#f2f7f2]">
              {goal.goalGetterName ?? "Tor"}
              {goal.isPenalty ? " · Elfmeter" : ""}
              {goal.isOwnGoal ? " · Eigentor" : ""}
            </span>
            <span className="rounded-full border border-[#d8b86a]/25 bg-[#273021]/45 px-3 py-1 font-mono text-sm font-bold text-[#f5edc9]">
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
  const showTableImpact = competition.hasTable || tableRows.length > 0;

  return (
    <RouteFrame
      eyebrow={meta.label}
      title={`${getTeamLabel(match.team1, "Offen")} gegen ${getTeamLabel(match.team2, "Offen")}`}
      description={
        showTableImpact
          ? "Eine cineastische Matchzentrale mit Ergebnis, Status, Ort, Spielverlauf, Statistiken und Tabellenwirkung."
          : "Eine cineastische Matchzentrale mit Ergebnis, Status, Ort, Spielverlauf und Statistiken."
      }
    >
      <section className="poster-surface relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#061512]/88 p-5 sm:p-7">
        <div
          aria-hidden
          className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${meta.accentClass}`}
        />
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#d8b86a]">
            <Icon className="h-4 w-4" />
            {competition.leagueLabel} · Saison {competition.resolvedSeason}
          </span>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${
              status === "live"
                ? "live-chip border-[#6eeaf2]/35 bg-[#07363a]/70 text-[#ddfbff]"
                : status === "finished"
                  ? "border-[#d8b86a]/30 bg-[#273021]/45 text-[#f5edc9]"
                  : "border-white/10 bg-white/[0.045] text-[#a8bbb2]"
            }`}
          >
            {status === "live" ? <Radio className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
            {getMatchStatusLabel(match)}
          </span>
        </div>

        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="grid justify-items-center gap-3 text-center md:justify-items-start md:text-left">
            <TeamBadge
              name={getTeamLabel(match.team1, "Offen")}
              iconUrl={match.team1?.teamIconUrl}
              size={76}
              className="bg-white/10 ring-1 ring-white/10"
            />
            <h2 className="text-2xl font-bold text-[#f2f7f2]">
              {getTeamLabel(match.team1, "Offen")}
            </h2>
            {team1Row ? (
              <p className="text-sm text-[#a8bbb2]">
                #{tableRows.indexOf(team1Row) + 1} · {team1Row.points ?? 0} Pkt.
              </p>
            ) : null}
          </div>

          <div className="grid justify-items-center gap-3">
            <span className="score-pill inline-flex min-w-[9rem] justify-center rounded-[1rem] px-6 py-4 text-[3rem] leading-none tracking-[0.04em] font-[var(--font-stadium-heading)] text-[#fff4c2] [text-shadow:0_0_24px_rgba(255,214,108,0.32)]">
              {status === "upcoming" ? formatMatchTime(match) : score}
            </span>
            <p className="text-center text-sm text-[#a8bbb2]">
              {match.group?.groupName ?? "Runde offen"}
              {venue ? ` · ${venue}` : ""}
            </p>
          </div>

          <div className="grid justify-items-center gap-3 text-center md:justify-items-end md:text-right">
            <TeamBadge
              name={getTeamLabel(match.team2, "Offen")}
              iconUrl={match.team2?.teamIconUrl}
              size={76}
              className="bg-white/10 ring-1 ring-white/10"
            />
            <h2 className="text-2xl font-bold text-[#f2f7f2]">
              {getTeamLabel(match.team2, "Offen")}
            </h2>
            {team2Row ? (
              <p className="text-sm text-[#a8bbb2]">
                #{tableRows.indexOf(team2Row) + 1} · {team2Row.points ?? 0} Pkt.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Timeline item={item} />

        <aside className="grid gap-4">
          <section className="poster-surface rounded-[1.25rem] border border-white/10 bg-[#061512]/86 p-5">
            <div className="section-kicker">Spieldaten</div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <span className="inline-flex items-center gap-2 text-[#a8bbb2]">
                  <CalendarDays className="h-4 w-4 text-[#6eeaf2]" />
                  Anstoß
                </span>
                <span className="font-semibold text-[#f2f7f2]">{formatMatchTime(match)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <span className="inline-flex items-center gap-2 text-[#a8bbb2]">
                  <MapPin className="h-4 w-4 text-[#6eeaf2]" />
                  Ort
                </span>
                <span className="max-w-[14rem] truncate text-right font-semibold text-[#f2f7f2]">
                  {venue ?? "Offen"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[#a8bbb2]">
                  <Goal className="h-4 w-4 text-[#d8b86a]" />
                  Tore
                </span>
                <span className="font-semibold text-[#f2f7f2]">
                  {match.goals?.length ?? 0}
                </span>
              </div>
            </div>
          </section>

          {showTableImpact ? (
            <section className="poster-surface rounded-[1.25rem] border border-white/10 bg-[#061512]/86 p-5">
              <div className="section-kicker">Tabellenwirkung</div>
              <div className="mt-4 grid gap-3">
                <p className="text-sm leading-6 text-[#a8bbb2]">
                  {tableRows.length > 0
                    ? "Tabellenkontext ist für beide Teams verfügbar, sobald sie in der Tabelle erscheinen."
                    : "Die Tabellenwirkung erscheint, sobald für diesen Wettbewerb Tabellen verfügbar sind."}
                </p>
                <Link
                  href="/tables"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8b86a]/25 bg-[#273021]/35 px-4 py-2 text-sm font-bold text-[#f5edc9] transition-colors hover:bg-[#333824]/45"
                >
                  <Table2 className="h-4 w-4" />
                  Tabellen öffnen
                </Link>
              </div>
            </section>
          ) : null}

          <section className="poster-surface rounded-[1.25rem] border border-white/10 bg-[#061512]/86 p-5">
            <div className="section-kicker">Statistiken</div>
            <div className="mt-4 grid gap-3">
              {["Ballbesitz", "Schüsse", "Ecken"].map((label) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-[#a8bbb2]">
                    <span>{label}</span>
                    <span>Feed ausstehend</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-1/2 rounded-full bg-[linear-gradient(90deg,#6eeaf2,#d8b86a)] opacity-45" />
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
