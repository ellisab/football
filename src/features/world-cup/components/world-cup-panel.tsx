import Link from "next/link";
import type {
  WorldCupGroupSection,
  WorldCupKnockoutRound,
  WorldCupSnapshot,
} from "@footballleagues/core/world-cup";
import { sortMatchesByUpcomingFirst } from "@footballleagues/core/matches";
import { Button } from "@footballleagues/ui/button";
import {
  CalendarDays,
  RefreshCw,
  RotateCcw,
  Rows3,
  ShieldAlert,
  Trophy,
} from "lucide-react";
import { MatchCard } from "@/features/matchday/components/match-card";
import { StandingsCard } from "@/features/standings/components/standings-card";
import { SectionHeading } from "@/features/home/components/section-heading";
import { SectionKicker } from "@/features/home/components/section-kicker";

const errorLabels: Record<WorldCupSnapshot["errors"][number], string> = {
  discovery: "Liga-Suche",
  groups: "Gruppen",
  matches: "Spiele",
  table: "Tabellen",
  teams: "Teams",
};

const lastUpdatedFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Europe/Berlin",
});

const formatLastUpdated = (value?: string) => {
  if (!value) return "Noch kein Update";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Noch kein Update";

  return lastUpdatedFormatter.format(date);
};

const getMatchKey = (
  match: WorldCupGroupSection["matches"][number],
  index: number
) => {
  return (
    match.matchID ??
    `${match.group?.groupOrderID ?? "group"}-${match.team1?.teamId ?? "home"}-${
      match.team2?.teamId ?? "away"
    }-${index}`
  );
};

const getRoundKey = (
  round: WorldCupGroupSection | WorldCupKnockoutRound,
  index: number
) => {
  return (
    round.group.groupID ??
    round.group.groupOrderID ??
    `${round.title}-${index}`
  );
};

const getTeamCount = (section: WorldCupGroupSection) => {
  if (section.table.length > 0) return section.table.length;

  const teams = new Set<string>();
  for (const match of section.matches) {
    const team1 = match.team1?.teamId ?? match.team1?.teamName ?? match.team1?.shortName;
    const team2 = match.team2?.teamId ?? match.team2?.teamName ?? match.team2?.shortName;

    if (team1) teams.add(String(team1));
    if (team2) teams.add(String(team2));
  }

  return teams.size;
};

const getGroupSummary = (section: WorldCupGroupSection) => {
  const teamCount = getTeamCount(section);
  const teamLabel = teamCount === 1 ? "Team" : "Teams";
  const matchLabel = section.matches.length === 1 ? "Spiel" : "Spiele";

  return `${teamCount} ${teamLabel} · ${section.matches.length} ${matchLabel}`;
};

function WorldCupHeader({ data }: { data: WorldCupSnapshot }) {
  const matchCount =
    data.groupSections.reduce((total, section) => total + section.matches.length, 0) +
    data.knockoutRounds.reduce((total, round) => total + round.matches.length, 0);

  return (
    <section
      id="world-cup"
      className="poster-surface relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,27,32,0.9),rgba(8,17,22,0.98))] p-5 sm:p-6"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(220,188,110,0.85),rgba(114,217,228,0.75),transparent)]" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:items-end">
        <div className="grid gap-3">
          <SectionKicker>Weltmeisterschaft</SectionKicker>
          <h2 className="max-w-[13ch] text-[2.8rem] leading-[0.86] font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f4efd6] sm:text-[4.4rem]">
            {data.leagueName}
          </h2>
          <p className="max-w-[62ch] text-sm leading-6 text-[#a9c0b6] sm:text-base">
            Saison {data.season}. Gruppen, K.-o.-Runden und Finale aus OpenLigaDB.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#9eb4ab]">
              <CalendarDays className="h-3.5 w-3.5 text-[#72d9e4]" />
              Saison
            </div>
            <div className="mt-1 text-xl font-semibold text-[#f4efd6]">{data.season}</div>
          </div>
          <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#9eb4ab]">
              <Rows3 className="h-3.5 w-3.5 text-[#72d9e4]" />
              Spiele
            </div>
            <div className="mt-1 text-xl font-semibold text-[#f4efd6]">{matchCount}</div>
          </div>
          <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#9eb4ab]">
              <RefreshCw className="h-3.5 w-3.5 text-[#72d9e4]" />
              Aktualisiert
            </div>
            <div className="mt-1 text-sm font-semibold text-[#f4efd6]">
              {formatLastUpdated(data.lastUpdated)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorldCupIssueBanner({ data }: { data: WorldCupSnapshot }) {
  if (data.errors.length === 0) return null;

  return (
    <div className="poster-empty flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-[#efaa57]/20 bg-[#2b1d13]/70 p-4 text-sm text-[#f8e4cf]">
      <span className="inline-flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-[#efaa57]" />
        OpenLigaDB konnte nicht alle WM-Daten laden:{" "}
        {data.errors.map((error) => errorLabels[error]).join(", ")}
      </span>
      <Button
        asChild
        size="sm"
        className="rounded-full bg-[#f4efd6] text-[#081116] hover:bg-[#fff8dd]"
      >
        <Link href={`/?league=wc&season=${data.season}`}>
          <RotateCcw className="h-4 w-4" />
          Erneut versuchen
        </Link>
      </Button>
    </div>
  );
}

function WorldCupEmptyState({ data }: { data: WorldCupSnapshot }) {
  return (
    <section className="poster-empty grid gap-4 rounded-[1.6rem] p-5 text-[#d7e5de] sm:p-6">
      <div className="flex items-start gap-3">
        <Trophy className="mt-1 h-5 w-5 shrink-0 text-[#dcbc6e]" />
        <div className="grid gap-2">
          <h3 className="text-xl font-semibold text-[#f4efd6]">
            WM-Daten noch nicht verfügbar
          </h3>
          <p className="max-w-[68ch] text-sm leading-6 text-[#a9c0b6]">
            {data.emptyReason ??
              "OpenLigaDB liefert für diese Saison noch keine Gruppen oder Spiele."}
          </p>
        </div>
      </div>
      <div>
        <Button
          asChild
          className="rounded-full bg-[linear-gradient(94deg,#f4efd6_0%,#dcbc6e_46%,#efaa57_100%)] text-[#081116] hover:brightness-105"
        >
          <Link href={`/?league=wc&season=${data.season}`}>
            <RotateCcw className="h-4 w-4" />
            Erneut versuchen
          </Link>
        </Button>
      </div>
    </section>
  );
}

function WorldCupGroup({
  kicker = "Gruppe",
  section,
}: {
  kicker?: "Gruppe";
  section: WorldCupGroupSection;
}) {
  const matches = sortMatchesByUpcomingFirst(section.matches);

  return (
    <section className="grid scroll-mt-40 gap-4 sm:scroll-mt-44">
      <div className="poster-empty flex flex-wrap items-end justify-between gap-3 rounded-[1.5rem] p-4 sm:p-5">
        <div className="min-w-0">
          <SectionKicker>{kicker}</SectionKicker>
          <h3 className="mt-2 text-3xl leading-none font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f4efd6] sm:text-4xl">
            {section.title}
          </h3>
          <p className="mt-2 text-sm text-[#a9c0b6]">{getGroupSummary(section)}</p>
        </div>
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
        {section.table.length > 0 ? (
          <StandingsCard table={section.table} />
        ) : (
          <div className="poster-empty rounded-[1.6rem] p-5 text-sm text-[#a9c0b6]">
            Für diese Gruppe ist noch keine Tabelle verfügbar.
          </div>
        )}
        <div className="grid min-w-0 gap-4">
          {matches.length > 0 ? (
            matches.map((match, index) => (
              <MatchCard key={getMatchKey(match, index)} match={match} />
            ))
          ) : (
            <div className="poster-empty rounded-[1.6rem] p-5 text-sm text-[#a9c0b6]">
              Für diese Gruppe sind noch keine Spiele verfügbar.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function WorldCupKnockout({ rounds }: { rounds: WorldCupKnockoutRound[] }) {
  if (rounds.length === 0) return null;

  return (
    <section id="world-cup-knockout" className="grid scroll-mt-40 gap-5 sm:scroll-mt-44">
      <SectionHeading
        kicker="K.-o.-Phase"
        title="Weg ins Finale"
        subtitle="Alle OpenLigaDB-Runden in API-Reihenfolge."
      />
      <div className="grid gap-6">
        {rounds.map((round, roundIndex) => (
          <section key={getRoundKey(round, roundIndex)} className="grid gap-3">
            <h3 className="text-2xl leading-none font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f4efd6]">
              {round.title}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {round.matches.length > 0 ? (
                sortMatchesByUpcomingFirst(round.matches).map((match, index) => (
                  <MatchCard key={getMatchKey(match, index)} match={match} />
                ))
              ) : (
                <div className="poster-empty rounded-[1.6rem] p-5 text-sm text-[#a9c0b6] md:col-span-2">
                  Für diese Runde sind noch keine Spiele verfügbar.
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

export function WorldCupPanel({ data }: { data: WorldCupSnapshot }) {
  const hasTournamentContent =
    data.groupSections.length > 0 || data.knockoutRounds.length > 0;

  return (
    <div className="grid gap-8 lg:gap-10">
      <WorldCupHeader data={data} />
      <WorldCupIssueBanner data={data} />

      {!hasTournamentContent ? (
        <WorldCupEmptyState data={data} />
      ) : (
        <>
          {data.groupSections.length > 0 ? (
            <section
              id="world-cup-groups"
              className="grid scroll-mt-40 gap-7 sm:scroll-mt-44"
            >
              <SectionHeading
                kicker="Gruppenphase"
                title="Alle Gruppen"
                subtitle="Jede von OpenLigaDB gelieferte Gruppe mit Tabelle und Spielen."
              />
              <div className="grid gap-9">
                {data.groupSections.map((section, index) => (
                  <WorldCupGroup
                    key={getRoundKey(section, index)}
                    kicker="Gruppe"
                    section={section}
                  />
                ))}
              </div>
            </section>
          ) : null}
          <WorldCupKnockout rounds={data.knockoutRounds} />
        </>
      )}
    </div>
  );
}
