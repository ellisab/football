import Link from "next/link";
import type {
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
import { SectionHeading } from "@/features/home/components/section-heading";
import { SectionKicker } from "@/features/home/components/section-kicker";

type VisibleWorldCupError = Exclude<
  WorldCupSnapshot["errors"][number],
  "table" | "teams"
>;

const errorLabels: Record<VisibleWorldCupError, string> = {
  discovery: "Liga-Suche",
  groups: "Runden",
  matches: "Spiele",
};

const isVisibleWorldCupError = (
  error: WorldCupSnapshot["errors"][number]
): error is VisibleWorldCupError => {
  return error in errorLabels;
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
  match: WorldCupKnockoutRound["matches"][number],
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
  round: WorldCupKnockoutRound,
  index: number
) => {
  return (
    round.group.groupID ??
    round.group.groupOrderID ??
    `${round.title}-${index}`
  );
};

function WorldCupHeader({ data }: { data: WorldCupSnapshot }) {
  const matchCount = data.knockoutRounds.reduce(
    (total, round) => total + round.matches.length,
    0
  );

  return (
    <section
      id="world-cup"
      className="poster-surface relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,27,32,0.9),rgba(8,17,22,0.98))] p-5 sm:p-6"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(216, 184, 106,0.85),rgba(110, 234, 242,0.75),transparent)]" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:items-end">
        <div className="grid gap-3">
          <SectionKicker>Weltmeisterschaft</SectionKicker>
          <h2 className="max-w-[13ch] text-[2.8rem] leading-[0.86] font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f5edc9] sm:text-[4.4rem]">
            {data.leagueName}
          </h2>
          <p className="max-w-[62ch] text-sm leading-6 text-[#a8bbb2] sm:text-base">
            Saison {data.season}. Finalrunde und Finale aus OpenLigaDB.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#8fa59c]">
              <CalendarDays className="h-3.5 w-3.5 text-[#6eeaf2]" />
              Saison
            </div>
            <div className="mt-1 text-xl font-semibold text-[#f5edc9]">{data.season}</div>
          </div>
          <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#8fa59c]">
              <Rows3 className="h-3.5 w-3.5 text-[#6eeaf2]" />
              Finalrundenspiele
            </div>
            <div className="mt-1 text-xl font-semibold text-[#f5edc9]">{matchCount}</div>
          </div>
          <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#8fa59c]">
              <RefreshCw className="h-3.5 w-3.5 text-[#6eeaf2]" />
              Aktualisiert
            </div>
            <div className="mt-1 text-sm font-semibold text-[#f5edc9]">
              {formatLastUpdated(data.lastUpdated)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorldCupIssueBanner({ data }: { data: WorldCupSnapshot }) {
  const relevantErrors = data.errors.filter(isVisibleWorldCupError);
  if (relevantErrors.length === 0) return null;

  return (
    <div className="poster-empty flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-[#ffb45f]/20 bg-[#2a1c18]/70 p-4 text-sm text-[#ffe4c8]">
      <span className="inline-flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-[#ffb45f]" />
        OpenLigaDB konnte nicht alle WM-Daten laden:{" "}
        {relevantErrors.map((error) => errorLabels[error]).join(", ")}
      </span>
      <Button
        asChild
        size="sm"
        className="rounded-full bg-[#f5edc9] text-[#030708] hover:bg-[#fff5cf]"
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
    <section className="poster-empty grid gap-4 rounded-[1.6rem] p-5 text-[#d7e4dd] sm:p-6">
      <div className="flex items-start gap-3">
        <Trophy className="mt-1 h-5 w-5 shrink-0 text-[#d8b86a]" />
        <div className="grid gap-2">
          <h3 className="text-xl font-semibold text-[#f5edc9]">
            WM-Daten noch nicht verfügbar
          </h3>
          <p className="max-w-[68ch] text-sm leading-6 text-[#a8bbb2]">
            {data.emptyReason ??
              "OpenLigaDB liefert für diese Saison noch keine Finalrundenspiele."}
          </p>
        </div>
      </div>
      <div>
        <Button
          asChild
          className="rounded-full bg-[linear-gradient(94deg,#f5edc9_0%,#d8b86a_46%,#ffb45f_100%)] text-[#030708] hover:brightness-105"
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

function WorldCupKnockout({ rounds }: { rounds: WorldCupKnockoutRound[] }) {
  if (rounds.length === 0) return null;

  return (
    <section id="world-cup-knockout" className="grid scroll-mt-40 gap-5 sm:scroll-mt-44">
      <SectionHeading
        kicker="Finalrunde"
        title="Weg ins Finale"
        subtitle="Achtelfinale, Viertelfinale, Halbfinale und Finale im Fokus."
      />
      <div className="grid gap-6">
        {rounds.map((round, roundIndex) => (
          <section key={getRoundKey(round, roundIndex)} className="grid gap-3">
            <h3 className="text-2xl leading-none font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f5edc9]">
              {round.title}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {round.matches.length > 0 ? (
                sortMatchesByUpcomingFirst(round.matches).map((match, index) => (
                  <MatchCard key={getMatchKey(match, index)} match={match} />
                ))
              ) : (
                <div className="poster-empty rounded-[1.6rem] p-5 text-sm text-[#a8bbb2] md:col-span-2">
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
  const hasTournamentContent = data.knockoutRounds.length > 0;

  return (
    <div className="grid gap-8 lg:gap-10">
      <WorldCupHeader data={data} />
      <WorldCupIssueBanner data={data} />

      {!hasTournamentContent ? (
        <WorldCupEmptyState data={data} />
      ) : (
        <WorldCupKnockout rounds={data.knockoutRounds} />
      )}
    </div>
  );
}
