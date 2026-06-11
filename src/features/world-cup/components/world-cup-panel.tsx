import Link from "next/link";
import type {
  WorldCupGroupSection,
  WorldCupKnockoutRound,
  WorldCupSnapshot,
} from "@footballleagues/core/world-cup";
import { Button } from "@footballleagues/ui/button";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Layers3,
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
import {
  MobileGroupSelector,
  type MobileGroupSelectorOption,
} from "./mobile-group-selector";

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

type GroupSelection = {
  section: WorldCupGroupSection;
  slug: string;
};

const normalizeSlug = (value?: string) => {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getGroupSlugBase = (section: WorldCupGroupSection, index: number) => {
  return (
    normalizeSlug(section.title) ||
    normalizeSlug(section.group.groupName) ||
    `gruppe-${index + 1}`
  );
};

const buildGroupSelections = (sections: WorldCupGroupSection[]) => {
  const seen = new Map<string, number>();

  return sections.map((section, index): GroupSelection => {
    const baseSlug = getGroupSlugBase(section, index);
    const count = seen.get(baseSlug) ?? 0;
    seen.set(baseSlug, count + 1);

    return {
      section,
      slug: count === 0 ? baseSlug : `${baseSlug}-${count + 1}`,
    };
  });
};

const berlinDatePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Berlin",
  year: "numeric",
});

const getBerlinDateKey = (date: Date) => {
  const parts = berlinDatePartsFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
};

const getMatchTime = (match: WorldCupGroupSection["matches"][number]) => {
  const value = match.matchDateTimeUTC ?? match.matchDateTime;
  if (!value) return Number.NaN;

  return Date.parse(value);
};

const chooseDefaultGroupSlug = (selections: GroupSelection[]) => {
  if (selections.length === 0) return undefined;

  const now = Date.now();
  const todayKey = getBerlinDateKey(new Date(now));
  const todaySelection = selections.find(({ section }) =>
    section.matches.some((match) => {
      const time = getMatchTime(match);
      return !Number.isNaN(time) && getBerlinDateKey(new Date(time)) === todayKey;
    })
  );

  if (todaySelection) return todaySelection.slug;

  const nextSelection = selections
    .map((selection) => {
      const nextMatchTime = selection.section.matches
        .map(getMatchTime)
        .filter((time) => !Number.isNaN(time) && time >= now)
        .sort((a, b) => a - b)[0];

      return { selection, nextMatchTime };
    })
    .filter(
      (entry): entry is { selection: GroupSelection; nextMatchTime: number } =>
        typeof entry.nextMatchTime === "number"
    )
    .sort((a, b) => a.nextMatchTime - b.nextMatchTime)[0];

  return nextSelection?.selection.slug ?? selections[0]?.slug;
};

const buildWorldCupHref = (season: number, group?: string) => {
  const params = new URLSearchParams({
    league: "wc",
    season: String(season),
  });

  if (group) {
    params.set("group", group);
  }

  return `/?${params.toString()}#world-cup-groups`;
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
          <SectionKicker>World Cup</SectionKicker>
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

function SelectorChip({
  href,
  isActive,
  label,
  meta,
}: {
  href: string;
  isActive: boolean;
  label: string;
  meta?: string | number;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
        isActive
          ? "border-[#dcbc6e]/60 bg-[#223d35]/88 text-[#f4efd6] shadow-[0_14px_30px_rgba(4,15,20,0.24)]"
          : "border-white/10 bg-white/[0.04] text-[#c8d7d0] hover:border-[#72d9e4]/35 hover:bg-white/[0.08] hover:text-[#f7fbf8]"
      }`}
    >
      <span>{label}</span>
      {meta !== undefined ? (
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            isActive ? "bg-[#dcbc6e]/18 text-[#fff3c2]" : "bg-white/[0.06] text-[#9eb4ab]"
          }`}
        >
          {meta}
        </span>
      ) : null}
    </Link>
  );
}

function WorldCupGroupSelector({
  data,
  selections,
  selectedKey,
  activeTitle,
}: {
  data: WorldCupSnapshot;
  selections: GroupSelection[];
  selectedKey: string;
  activeTitle: string;
}) {
  const knockoutMatchCount = data.knockoutRounds.reduce(
    (total, round) => total + round.matches.length,
    0
  );
  const selectorOptions: MobileGroupSelectorOption[] = [
    {
      href: buildWorldCupHref(data.season, "all"),
      key: "all",
      label: "Alle",
      meta: data.groupSections.length,
    },
    ...selections.map(({ section, slug }) => ({
      href: buildWorldCupHref(data.season, slug),
      key: slug,
      label: section.title,
      meta: section.matches.length,
    })),
    ...(data.knockoutRounds.length > 0
      ? [
          {
            href: buildWorldCupHref(data.season, "knockout"),
            key: "knockout",
            label: "K.-o.",
            meta: knockoutMatchCount,
          },
        ]
      : []),
  ];

  return (
    <section
      id="world-cup-groups"
      className="sticky top-3 z-20 grid scroll-mt-28 gap-3 rounded-[1.35rem] border border-white/10 bg-[#081116]/88 p-3 shadow-[0_18px_42px_rgba(2,9,12,0.34)] backdrop-blur-xl"
    >
      <div className="flex min-w-0 flex-col gap-3 md:grid md:grid-cols-[minmax(9.5rem,11rem)_minmax(0,1fr)] md:items-start">
        <div className="min-w-0 md:pt-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#dcbc6e]">
            <Layers3 className="h-3.5 w-3.5" />
            Auswahl
          </div>
          <div className="mt-1 hidden text-lg leading-tight font-semibold text-[#f4efd6] md:block">
            {activeTitle}
          </div>
        </div>

        <MobileGroupSelector
          activeTitle={activeTitle}
          options={selectorOptions}
          selectedKey={selectedKey}
        />

        <div className="hidden min-w-0 flex-wrap gap-2 md:flex">
          {selectorOptions.map((option) => (
            <SelectorChip
              key={option.key}
              href={option.href}
              isActive={selectedKey === option.key}
              label={option.label}
              meta={option.meta}
            />
          ))}
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
        OpenLigaDB konnte nicht alle World-Cup-Daten laden:{" "}
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
            World-Cup-Daten noch nicht verfuegbar
          </h3>
          <p className="max-w-[68ch] text-sm leading-6 text-[#a9c0b6]">
            {data.emptyReason ??
              "OpenLigaDB liefert fuer diese Saison noch keine Gruppen oder Spiele."}
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
  kicker = "Ausgewählte Gruppe",
  next,
  previous,
  section,
  season,
}: {
  kicker?: "Ausgewählte Gruppe" | "Gruppe";
  next?: GroupSelection;
  previous?: GroupSelection;
  section: WorldCupGroupSection;
  season: number;
}) {
  return (
    <section className="grid scroll-mt-28 gap-4">
      <div className="poster-empty flex flex-wrap items-end justify-between gap-3 rounded-[1.5rem] p-4 sm:p-5">
        <div className="min-w-0">
          <SectionKicker>{kicker}</SectionKicker>
          <h3 className="mt-2 text-3xl leading-none font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f4efd6] sm:text-4xl">
            {section.title}
          </h3>
          <p className="mt-2 text-sm text-[#a9c0b6]">{getGroupSummary(section)}</p>
        </div>
        <div className="flex gap-2">
          {previous ? (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="rounded-full border-white/15 bg-white/[0.04] text-[#edf6ef] hover:bg-white/[0.1]"
            >
              <Link href={buildWorldCupHref(season, previous.slug)}>
                <ChevronLeft className="h-4 w-4" />
                Vorige
              </Link>
            </Button>
          ) : null}
          {next ? (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="rounded-full border-white/15 bg-white/[0.04] text-[#edf6ef] hover:bg-white/[0.1]"
            >
              <Link href={buildWorldCupHref(season, next.slug)}>
                Nächste
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
        {section.table.length > 0 ? (
          <StandingsCard table={section.table} />
        ) : (
          <div className="poster-empty rounded-[1.6rem] p-5 text-sm text-[#a9c0b6]">
            Fuer diese Gruppe ist noch keine Tabelle verfuegbar.
          </div>
        )}
        <div className="grid min-w-0 gap-4">
          {section.matches.length > 0 ? (
            section.matches.map((match, index) => (
              <MatchCard key={getMatchKey(match, index)} match={match} />
            ))
          ) : (
            <div className="poster-empty rounded-[1.6rem] p-5 text-sm text-[#a9c0b6]">
              Fuer diese Gruppe sind noch keine Spiele verfuegbar.
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
    <section id="world-cup-knockout" className="grid scroll-mt-28 gap-5">
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
                round.matches.map((match, index) => (
                  <MatchCard key={getMatchKey(match, index)} match={match} />
                ))
              ) : (
                <div className="poster-empty rounded-[1.6rem] p-5 text-sm text-[#a9c0b6] md:col-span-2">
                  Fuer diese Runde sind noch keine Spiele verfuegbar.
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

export function WorldCupPanel({
  data,
  selectedGroup,
}: {
  data: WorldCupSnapshot;
  selectedGroup?: string;
}) {
  const hasTournamentContent =
    data.groupSections.length > 0 || data.knockoutRounds.length > 0;
  const selections = buildGroupSelections(data.groupSections);
  const normalizedSelectedGroup = normalizeSlug(selectedGroup);
  const defaultGroupSlug = chooseDefaultGroupSlug(selections);
  const requestedGroupExists = selections.some(
    (selection) => selection.slug === normalizedSelectedGroup
  );
  const selectedKey =
    normalizedSelectedGroup === "all" ||
    normalizedSelectedGroup === "knockout" ||
    requestedGroupExists
      ? normalizedSelectedGroup
      : defaultGroupSlug ?? (data.knockoutRounds.length > 0 ? "knockout" : "all");
  const selectedIndex = selections.findIndex((selection) => selection.slug === selectedKey);
  const selectedSelection =
    selectedIndex >= 0 ? selections[selectedIndex] : undefined;
  const activeTitle =
    selectedKey === "all"
      ? "Alle Gruppen"
      : selectedKey === "knockout"
        ? "K.-o.-Phase"
        : selectedSelection?.section.title ?? "World Cup";

  return (
    <div className="grid gap-8 lg:gap-10">
      <WorldCupHeader data={data} />
      <WorldCupIssueBanner data={data} />

      {!hasTournamentContent ? (
        <WorldCupEmptyState data={data} />
      ) : (
        <>
          <WorldCupGroupSelector
            data={data}
            selections={selections}
            selectedKey={selectedKey}
            activeTitle={activeTitle}
          />

          {selectedKey === "all" ? (
            <section className="grid scroll-mt-28 gap-7">
              <SectionHeading
                kicker="Gruppenphase"
                title="Alle Gruppen"
                subtitle="Jede von OpenLigaDB gelieferte Gruppe mit Tabelle und Spielen."
              />
              <div className="grid gap-9">
                {selections.map(({ section, slug }, index) => (
                  <WorldCupGroup
                    key={slug}
                    kicker="Gruppe"
                    section={section}
                    season={data.season}
                    previous={selections[index - 1]}
                    next={selections[index + 1]}
                  />
                ))}
              </div>
            </section>
          ) : selectedKey === "knockout" ? (
            <WorldCupKnockout rounds={data.knockoutRounds} />
          ) : selectedSelection ? (
            <WorldCupGroup
              section={selectedSelection.section}
              season={data.season}
              previous={selections[selectedIndex - 1]}
              next={selections[selectedIndex + 1]}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
