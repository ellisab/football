import Link from "next/link";
import { BracketSection } from "@/features/champions-league/components/bracket-section";
import {
  getCompetitionHref,
  getCompetitionMeta,
  PRIMARY_NAV_ITEMS,
} from "@/features/football/competition-meta";
import {
  formatMatchTime,
  formatTodayLabel,
  getAllCompetitionMatches,
  getCompetitionMatches,
  getCompetitionNextKickoff,
  getMatchIdentity,
  getMatchScore,
  getMatchStatus,
  getMatchStatusLabel,
  getStatusCounts,
  getTeamLabel,
  getTodayCompetitionMatches,
  getUpcomingCompetitionMatchCount,
  hasCompetitionTable,
  sortOverviewCompetitions,
  type CompetitionMatch,
} from "@/features/football/view-utils";
import { StandingsCard } from "@/features/standings/components/standings-card";
import { TeamBadge } from "@/features/teams/components/team-badge";
import { WorldCupPanel } from "@/features/world-cup/components/world-cup-panel";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Clock3,
  Goal,
  Radio,
  Search,
  ShieldCheck,
  Table2,
  Trophy,
} from "lucide-react";
import type {
  WebCompetitionViewModel,
  WebHomeSection,
  WebHomeViewModel,
} from "../presenter/home-view-model";
import { ErrorBanner } from "./error-banner";
import { HomeHero, type HomeHeroImage, type HomeHeroStat } from "./home-hero";
import { RoundSection } from "./round-section";
import { SectionKicker } from "./section-kicker";

const getWorldCupMatchCount = (data: NonNullable<WebHomeViewModel["worldCup"]>) => {
  return (
    data.groupSections.reduce((total, section) => total + section.matches.length, 0) +
    data.knockoutRounds.reduce((total, round) => total + round.matches.length, 0)
  );
};

const getLeagueAnchorId = (competition: WebCompetitionViewModel) => {
  return `league-${competition.resolvedLeague}`;
};

const getSectionAnchorId = (
  competition: WebCompetitionViewModel,
  section: WebHomeSection
) => {
  return `${getLeagueAnchorId(competition)}-${section.key}`;
};

const getPrimaryActionHref = (
  data: WebHomeViewModel,
  hasTodayMatches: boolean
) => {
  if (hasTodayMatches) {
    return "#today";
  }

  if (data.isOverview) {
    return "#overview";
  }

  if (data.worldCup) {
    return data.worldCup.groupSections.length > 0
      ? "#world-cup-groups"
      : "#world-cup";
  }

  if (data.sections.some((section) => section.key === "matchday")) {
    return "#matchday";
  }

  if (data.bracketMatches.length > 0) {
    return "#bracket";
  }

  if (data.sections.some((section) => section.key === "next-round")) {
    return "#next-round";
  }

  return "#table";
};

const getSecondaryActionHref = (data: WebHomeViewModel) => {
  if (data.isOverview) {
    return "#overview";
  }

  if (data.worldCup) {
    return data.worldCup.knockoutRounds.length > 0
      ? "#world-cup-knockout"
      : getPrimaryActionHref(data, false);
  }

  if (data.hasTable) {
    return "#table";
  }

  if (data.sections.some((section) => section.key === "next-round")) {
    return "#next-round";
  }

  return getPrimaryActionHref(data, false);
};

const getHeroHeadline = (data: WebHomeViewModel) => {
  if (data.isOverview) {
    return "Today in Football";
  }

  if (data.worldCup) {
    return `${data.worldCup.leagueName} Spielplan & Tabellen`;
  }

  return data.hasTable
    ? `${data.leagueLabel} Spieltag & Tabelle`
    : `${data.leagueLabel} Spielplan & Ergebnisse`;
};

const getHeroImage = (data: WebHomeViewModel): HomeHeroImage => {
  if (!data.isOverview && data.resolvedLeague === "wc") {
    return {
      alt: "Deutscher Fussballspieler mit dem WM-Pokal im Flutlichtstadion",
      src: "/images/spieltag-atlas-hero.png",
      variant: "world-cup",
    };
  }

  return {
    alt: "Fussballspieler beim Schuss in einem Flutlichtstadion",
    src: "/images/spieltag-atlas-hero.png",
    variant: "league",
  };
};

const getHeroPreviewStats = (
  data: WebHomeViewModel,
  todayMatchCount: number
): HomeHeroStat[] => {
  if (data.isOverview && data.competitions) {
    const upcomingCount = data.competitions.reduce(
      (total, competition) => total + getUpcomingCompetitionMatchCount(competition),
      0
    );
    const tableCount = data.competitions.filter(hasCompetitionTable).length;

    return [
      {
        detail: todayMatchCount === 1 ? "Spiel" : "Spiele",
        label: "Heute",
        value: String(todayMatchCount),
      },
      {
        detail: `${data.competitions.length} Wettbewerbe`,
        label: "Anstehend",
        value: String(upcomingCount),
      },
      {
        detail: "direkt sichtbar",
        label: "Tabellen",
        value: String(tableCount),
      },
    ];
  }

  if (data.worldCup) {
    const matchCount = getWorldCupMatchCount(data.worldCup);

    return [
      {
        detail: todayMatchCount === 1 ? "Spiel" : "Spiele",
        label: "Heute",
        value: String(todayMatchCount),
      },
      {
        detail: data.worldCup.leagueName,
        label: "Saison",
        value: String(data.worldCup.season),
      },
      {
        detail: "OpenLigaDB",
        label: "Spiele",
        value: String(matchCount),
      },
    ];
  }

  const roundSection = data.sections.find((section) => section.renderKind !== "table");
  const roundMatchCount = roundSection ? roundSection.items.length : 0;

  return [
    {
      detail: todayMatchCount === 1 ? "Spiel" : "Spiele",
      label: "Heute",
      value: String(todayMatchCount),
    },
    {
      detail: data.leagueLabel,
      label: "Saison",
      value: String(data.resolvedSeason),
    },
    {
      detail: `${roundMatchCount} ${roundMatchCount === 1 ? "Spiel" : "Spiele"}`,
      label: roundSection?.kicker ?? "Runde",
      value: roundSection?.title ?? "Offen",
    },
  ];
};

function OrbitNavigation({
  currentLabel,
  liveCount,
}: {
  currentLabel: string;
  liveCount: number;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050a0d]/82 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-[1240px] items-center gap-3 px-4 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-sm font-semibold text-[#edf6ef] transition-colors hover:border-[#dcbc6e]/40 hover:bg-white/[0.09]"
          aria-label="Spieltag Orbit Home"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[linear-gradient(135deg,#f4efd6,#dcbc6e_48%,#72d9e4)] text-xs font-black text-[#050a0d]">
            SO
          </span>
          <span className="hidden sm:inline">Spieltag Orbit</span>
        </Link>

        <nav
          aria-label="Hauptnavigation"
          className="flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {PRIMARY_NAV_ITEMS.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="inline-flex shrink-0 items-center rounded-full border border-transparent px-3 py-2 text-sm font-semibold text-[#a9c0b6] transition-colors hover:border-white/10 hover:bg-white/[0.06] hover:text-[#edf6ef]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-semibold text-[#a9c0b6]">
            <CalendarDays className="h-3.5 w-3.5 text-[#72d9e4]" />
            {currentLabel}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold ${
              liveCount > 0
                ? "live-chip border-[#72d9e4]/35 bg-[#0c2f36]/70 text-[#c6f7fb]"
                : "border-white/10 bg-white/[0.045] text-[#a9c0b6]"
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            {liveCount} Live
          </span>
        </div>

        <Link
          href="/teams"
          aria-label="Teams suchen"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.055] text-[#c8d7d0] transition-colors hover:border-[#72d9e4]/35 hover:text-[#edf6ef]"
        >
          <Search className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}

function OrbitContextBar({
  data,
  statusCounts,
}: {
  data: WebHomeViewModel;
  statusCounts: Record<"finished" | "live" | "upcoming", number>;
}) {
  const meta = getCompetitionMeta(data.resolvedLeague);
  const Icon = meta.icon;
  const label = data.isOverview ? "Today in Football" : meta.label;
  const category = data.isOverview ? "Global" : meta.category;
  const round = data.isOverview
    ? "Daily dashboard"
    : data.sections.find((section) => section.renderKind !== "table")?.title ??
      "Round open";

  return (
    <div className="sticky top-16 z-40 border-b border-white/10 bg-[#071416]/78 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1240px] gap-2 overflow-x-auto px-4 py-2 text-xs [scrollbar-width:none] sm:px-6 lg:px-10 [&::-webkit-scrollbar]:hidden">
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 font-bold text-[#edf6ef]">
          <Icon className="h-3.5 w-3.5 text-[#dcbc6e]" />
          {label}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 font-semibold text-[#a9c0b6]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#72d9e4]" />
          {category}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 font-semibold text-[#a9c0b6]">
          <Trophy className="h-3.5 w-3.5 text-[#dcbc6e]" />
          Saison {data.resolvedSeason}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 font-semibold text-[#a9c0b6]">
          <Activity className="h-3.5 w-3.5 text-[#43c886]" />
          {round}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#72d9e4]/25 bg-[#0c2f36]/45 px-3 py-1.5 font-bold text-[#c6f7fb]">
          {statusCounts.live} Live
        </span>
        <span className="inline-flex shrink-0 items-center rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 font-semibold text-[#a9c0b6]">
          {statusCounts.upcoming} Upcoming
        </span>
        <span className="inline-flex shrink-0 items-center rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 font-semibold text-[#a9c0b6]">
          {statusCounts.finished} Finished
        </span>
      </div>
    </div>
  );
}

function MatchTicker({ matches }: { matches: CompetitionMatch[] }) {
  if (matches.length === 0) {
    return (
      <section className="poster-surface relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#071416]/88 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <SectionKicker>Live Rail</SectionKicker>
            <p className="mt-2 text-sm text-[#a9c0b6]">
              No live or upcoming matches are visible in the current data.
            </p>
          </div>
          <Clock3 className="h-5 w-5 text-[#72d9e4]" />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Live und kommende Spiele"
      className="poster-surface live-rail relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#071416]/88 p-3"
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-[#72d9e4]/30 bg-[#0c2f36]/70 text-[#c6f7fb]">
            <Radio className="h-4 w-4" />
          </span>
          <div>
            <SectionKicker>Now / Next / Final</SectionKicker>
            <p className="mt-1 text-xs text-[#8da49b]">Swipe the match rail</p>
          </div>
        </div>
        <Link
          href="/today"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-bold text-[#edf6ef] transition-colors hover:border-[#72d9e4]/30 hover:bg-white/[0.08]"
        >
          All today
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {matches.slice(0, 14).map((item, index) => {
          const { competition, match } = item;
          const status = getMatchStatus(match);
          const meta = getCompetitionMeta(competition.resolvedLeague);
          const Icon = meta.icon;
          const score = getMatchScore(match);
          const href = match.matchID ? `/matches/${match.matchID}` : "#today";

          return (
            <Link
              key={`${competition.resolvedLeague}-${getMatchIdentity(match)}-${index}`}
              href={href}
              className="group grid min-h-[9rem] w-[17.5rem] shrink-0 content-between overflow-hidden rounded-[1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-3 transition-all hover:-translate-y-0.5 hover:border-[#72d9e4]/35 hover:bg-white/[0.08]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#dcbc6e]">
                  <Icon className="h-3 w-3" />
                  <span className="truncate">{meta.shortLabel}</span>
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] ${
                    status === "live"
                      ? "live-chip border border-[#72d9e4]/35 bg-[#0c2f36]/70 text-[#c6f7fb]"
                      : status === "finished"
                        ? "border border-[#dcbc6e]/25 bg-[#463614]/46 text-[#f4ebc2]"
                        : "border border-white/10 bg-white/[0.045] text-[#a9c0b6]"
                  }`}
                >
                  {getMatchStatusLabel(match)}
                </span>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <TeamBadge
                      name={getTeamLabel(match.team1, "TBD")}
                      iconUrl={match.team1?.teamIconUrl}
                      size={26}
                      className="bg-white/10 ring-1 ring-white/10"
                    />
                    <span className="truncate text-sm font-semibold text-[#edf6ef]">
                      {getTeamLabel(match.team1, "TBD")}
                    </span>
                  </div>
                  <span className="font-mono text-lg font-bold text-[#f4efd6]">
                    {score.split(":")[0] ?? "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <TeamBadge
                      name={getTeamLabel(match.team2, "TBD")}
                      iconUrl={match.team2?.teamIconUrl}
                      size={26}
                      className="bg-white/10 ring-1 ring-white/10"
                    />
                    <span className="truncate text-sm font-semibold text-[#edf6ef]">
                      {getTeamLabel(match.team2, "TBD")}
                    </span>
                  </div>
                  <span className="font-mono text-lg font-bold text-[#f4efd6]">
                    {score.split(":")[1] ?? "-"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function CompetitionCapsulesSection({
  competitions,
}: {
  competitions: WebCompetitionViewModel[];
}) {
  if (competitions.length === 0) return null;

  return (
    <section id="competitions" className="grid scroll-mt-44 gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionKicker>Competitions</SectionKicker>
          <h2 className="mt-2 text-[2rem] leading-[0.9] font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f4efd6] sm:text-[2.65rem]">
            Quick access
          </h2>
        </div>
        <Link
          href="/tables"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm font-bold text-[#edf6ef] transition-colors hover:border-[#dcbc6e]/35 hover:bg-white/[0.08]"
        >
          <Table2 className="h-4 w-4 text-[#dcbc6e]" />
          Tables
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {competitions.map((competition) => {
          const meta = getCompetitionMeta(competition.resolvedLeague);
          const Icon = meta.icon;
          const matches = getCompetitionMatches(competition).map((match) => ({
            competition,
            match,
          }));
          const counts = getStatusCounts(matches);
          const nextKickoff = getCompetitionNextKickoff(competition);
          const tableSection = competition.sections.find(
            (section) => section.renderKind === "table"
          );
          const leader =
            tableSection?.renderKind === "table"
              ? tableSection.items[0]?.teamName
              : competition.worldCup?.groupSections[0]?.table[0]?.teamName;

          return (
            <Link
              key={`${competition.resolvedLeague}-${competition.resolvedSeason}`}
              href={getCompetitionHref(
                {
                  seasons: [competition.resolvedSeason],
                  shortcut: competition.resolvedLeague,
                },
                competition.resolvedSeason
              )}
              className="poster-surface group relative grid min-h-[12rem] overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#071416]/86 p-4 transition-all hover:-translate-y-0.5 hover:border-[#72d9e4]/35"
            >
              <div
                aria-hidden
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${meta.accentClass}`}
              />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#a9c0b6]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#72d9e4]" />
                    {meta.category}
                  </span>
                  <h3 className="mt-3 text-2xl leading-none font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f4efd6]">
                    {meta.label}
                  </h3>
                  <p className="mt-2 text-sm text-[#a9c0b6]">
                    Saison {competition.resolvedSeason}
                    {leader ? ` · Leader: ${leader}` : ""}
                  </p>
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-[#dcbc6e]">
                  <Icon className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-[0.8rem] border border-[#72d9e4]/20 bg-[#0c2f36]/45 p-2">
                  <div className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#8fdfe7]">
                    Live
                  </div>
                  <div className="mt-1 font-mono text-xl font-bold text-[#c6f7fb]">
                    {counts.live}
                  </div>
                </div>
                <div className="rounded-[0.8rem] border border-white/10 bg-white/[0.045] p-2">
                  <div className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#9fb6ad]">
                    Next
                  </div>
                  <div className="mt-1 truncate font-mono text-sm font-bold text-[#f4efd6]">
                    {typeof nextKickoff === "number"
                      ? new Intl.DateTimeFormat("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Europe/Berlin",
                        }).format(new Date(nextKickoff))
                      : "offen"}
                  </div>
                </div>
                <div className="rounded-[0.8rem] border border-[#dcbc6e]/20 bg-[#463614]/35 p-2">
                  <div className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#dcbc6e]">
                    Table
                  </div>
                  <div className="mt-1 font-mono text-xl font-bold text-[#f4efd6]">
                    {hasCompetitionTable(competition) ? "On" : "-"}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TodayMatchRow({
  item,
}: {
  item: CompetitionMatch;
}) {
  const { competition, match } = item;
  const score = getMatchScore(match);
  const status = getMatchStatus(match);
  const meta = getCompetitionMeta(competition.resolvedLeague);
  const Icon = meta.icon;
  const href = match.matchID ? `/matches/${match.matchID}` : "#today";

  return (
    <li className="border-t border-white/10 first:border-t-0">
      <Link
        href={href}
        className="grid min-w-0 gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04] sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-center sm:px-5"
      >
      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#f4efd6]">
        <Clock3 className="h-4 w-4 shrink-0 text-[#72d9e4]" />
        <span>{formatMatchTime(match)}</span>
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-[#9eb4ab]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#dcbc6e]">
            <Icon className="h-3.5 w-3.5" />
            {meta.shortLabel}
          </span>
          <span>{status === "live" ? "Live" : status === "finished" ? "Beendet" : "Anstehend"}</span>
        </div>
        <div className="mt-1 grid min-w-0 gap-1 text-base font-semibold text-[#edf6ef] sm:text-lg">
          <span className="min-w-0 truncate">
            {getTeamLabel(match.team1, "TBD")}
          </span>
          <span className="min-w-0 truncate">
            {getTeamLabel(match.team2, "TBD")}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="text-xs text-[#9eb4ab] sm:hidden">Stand</span>
        <span className="score-pill inline-flex min-w-[4.25rem] justify-center rounded-full px-4 py-2 text-[1.35rem] leading-none tracking-[0.04em] font-[var(--font-stadium-heading)] text-[#fff6d0] [text-shadow:0_0_24px_rgba(255,214,108,0.32)]">
          {score}
        </span>
      </div>
      </Link>
    </li>
  );
}

function TodayMatchesSection({
  leagueLabel,
  matches,
  todayLabel,
}: {
  leagueLabel: string;
  matches: CompetitionMatch[];
  todayLabel: string;
}) {
  return (
    <section id="today" className="grid scroll-mt-40 gap-3 sm:scroll-mt-44">
      <SectionKicker>Heute</SectionKicker>
      <div className="poster-surface relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,27,32,0.92),rgba(8,17,22,0.98))]">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(220,188,110,0.85),rgba(114,217,228,0.75),transparent)]" />
        <div className="flex flex-wrap items-end justify-between gap-3 p-4 sm:p-5">
          <div>
            <h2 className="text-[2rem] leading-[0.9] font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f4efd6] sm:text-[2.65rem]">
              Spiele heute
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#a9c0b6]">
              {todayLabel} · {matches.length}{" "}
              {matches.length === 1 ? "Spiel" : "Spiele"} in {leagueLabel}.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#72d9e4]/30 bg-[#0c2f36]/60 px-3 py-1.5 text-sm font-semibold text-[#c6f7fb]">
            <Goal className="h-4 w-4" />
            Schnellansicht
          </span>
        </div>

        {matches.length > 0 ? (
          <ol aria-label="Heutige Spiele">
            {matches.map((item, index) => (
              <TodayMatchRow
                key={`${item.competition.resolvedLeague}-${getMatchIdentity(item.match)}-${index}`}
                item={item}
              />
            ))}
          </ol>
        ) : (
          <div className="border-t border-white/10 p-4 text-sm leading-6 text-[#a9c0b6] sm:p-5">
            Heute sind in {leagueLabel} keine Spiele angesetzt.
          </div>
        )}
      </div>
    </section>
  );
}

function HomeSection({
  section,
  sectionId,
}: {
  section: WebHomeSection;
  sectionId?: string;
}) {
  if (section.renderKind !== "table") {
    return (
      <RoundSection
        key={sectionId ?? section.key}
        section={section}
        sectionId={sectionId}
      />
    );
  }

  return (
    <section
      key={sectionId ?? section.key}
      id={sectionId ?? section.key}
      className="grid w-full min-w-0 scroll-mt-40 gap-3 sm:scroll-mt-44"
    >
      <SectionKicker>{section.kicker}</SectionKicker>
      <StandingsCard table={section.items} emptyText={section.emptyText} />
    </section>
  );
}

function LeagueCompetitionBlock({
  competition,
}: {
  competition: WebCompetitionViewModel;
}) {
  if (competition.worldCup) {
    return (
      <section
        id={getLeagueAnchorId(competition)}
        className="grid scroll-mt-40 gap-4 sm:scroll-mt-44"
      >
        <WorldCupPanel data={competition.worldCup} />
      </section>
    );
  }

  const nextRoundSections = competition.sections.filter(
    (section) => section.key === "next-round"
  );
  const remainingSections = competition.sections.filter(
    (section) => section.key !== "next-round"
  );
  const matchCount = getCompetitionMatches(competition).length;
  const upcomingCount = getUpcomingCompetitionMatchCount(competition);

  return (
    <section
      id={getLeagueAnchorId(competition)}
      className="grid scroll-mt-40 gap-5 sm:scroll-mt-44"
    >
      <div className="poster-empty flex flex-wrap items-end justify-between gap-4 rounded-[1.5rem] p-4 sm:p-5">
        <div className="min-w-0">
          <SectionKicker>{competition.leagueLabel}</SectionKicker>
          <h2 className="mt-2 text-3xl leading-none font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f4efd6] sm:text-4xl">
            {competition.leagueLabel}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#a9c0b6]">
            Saison {competition.resolvedSeason} · {upcomingCount} anstehend ·{" "}
            {matchCount} Spiele
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:gap-10">
        {nextRoundSections.map((section) => (
          <HomeSection
            key={getSectionAnchorId(competition, section)}
            section={section}
            sectionId={getSectionAnchorId(competition, section)}
          />
        ))}

        {competition.bracketMatches.length > 0 ? (
          <section
            id={`${getLeagueAnchorId(competition)}-bracket`}
            className="grid scroll-mt-40 gap-4 sm:scroll-mt-44"
          >
            <BracketSection
              title={`${competition.leagueLabel} Baum`}
              rounds={competition.bracketMatches}
            />
          </section>
        ) : null}

        {remainingSections.map((section) => (
          <HomeSection
            key={getSectionAnchorId(competition, section)}
            section={section}
            sectionId={getSectionAnchorId(competition, section)}
          />
        ))}
      </div>
    </section>
  );
}

export function HomeView({ data }: { data: WebHomeViewModel }) {
  const overviewCompetitions =
    data.isOverview && data.competitions
      ? sortOverviewCompetitions(data.competitions)
      : [];
  const visibleCompetitions =
    data.isOverview && overviewCompetitions.length > 0
      ? overviewCompetitions
      : [data];
  const today = new Date();
  const todayMatches = getTodayCompetitionMatches({
    competitions: visibleCompetitions,
    date: today,
  });
  const allMatches = getAllCompetitionMatches(visibleCompetitions);
  const statusCounts = getStatusCounts(allMatches);
  const tickerMatches =
    todayMatches.length > 0
      ? todayMatches
      : allMatches.filter((item) => getMatchStatus(item.match) !== "finished");
  const primaryActionHref = getPrimaryActionHref(data, todayMatches.length > 0);
  const secondaryActionHref = getSecondaryActionHref(data);
  const heroHeadline = getHeroHeadline(data);
  const heroImage = getHeroImage(data);
  const heroPreviewStats = getHeroPreviewStats(data, todayMatches.length);
  const todayLabel = formatTodayLabel(today);
  const nextRoundSections = data.sections.filter((section) => section.key === "next-round");
  const remainingSections = data.sections.filter((section) => section.key !== "next-round");
  const hasVisibleTable = data.isOverview
    ? overviewCompetitions.some(hasCompetitionTable)
    : data.hasTable;

  return (
    <div className="poster-shell min-h-screen w-full text-[#edf6ef]">
      <main className="relative z-10">
        <OrbitNavigation
          currentLabel={data.isOverview ? "Today" : data.leagueLabel}
          liveCount={statusCounts.live}
        />
        <OrbitContextBar data={data} statusCounts={statusCounts} />
        <HomeHero
          hasTable={hasVisibleTable}
          headline={heroHeadline}
          image={heroImage}
          leagueLabel={data.isOverview ? "Alle Wettbewerbe" : data.leagueLabel}
          leagueOptions={data.leagueOptions}
          currentLeague={data.isOverview ? undefined : data.resolvedLeague}
          currentSeason={data.resolvedSeason}
          description={
            data.isOverview
              ? "Alle verfügbaren Wettbewerbe auf einer Seite: kommende Spiele zuerst, danach Ergebnisse, Tabellen und K.-o.-Runden ohne Umwege."
              : undefined
          }
          getLeagueHref={
            data.isOverview
              ? (option, season) => getCompetitionHref(option, season)
              : undefined
          }
          primaryHref={primaryActionHref}
          previewStats={heroPreviewStats}
          season={data.resolvedSeason}
          secondaryHref={secondaryActionHref}
        />

        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-4 pb-14 pt-6 sm:px-6 sm:pb-20 sm:pt-8 lg:gap-10 lg:px-10">
          <div className="-mt-16 sm:-mt-20">
            <MatchTicker matches={tickerMatches} />
          </div>
          <ErrorBanner errors={data.visibleErrors} />
          {data.isOverview ? (
            <CompetitionCapsulesSection competitions={overviewCompetitions} />
          ) : null}
          <TodayMatchesSection
            leagueLabel={data.isOverview ? "Alle Wettbewerbe" : data.leagueLabel}
            matches={todayMatches}
            todayLabel={todayLabel}
          />

          {data.isOverview && overviewCompetitions.length > 0 ? (
            <section id="overview" className="grid scroll-mt-40 gap-9 sm:scroll-mt-44">
              {overviewCompetitions.map((competition) => (
                <LeagueCompetitionBlock
                  key={`${competition.resolvedLeague}-${competition.resolvedSeason}`}
                  competition={competition}
                />
              ))}
            </section>
          ) : data.worldCup ? (
            <WorldCupPanel data={data.worldCup} />
          ) : (
            <div className="grid gap-8 lg:gap-10">
              {nextRoundSections.map((section) => (
                <HomeSection key={section.key} section={section} />
              ))}

              {data.bracketMatches.length > 0 ? (
                <section id="bracket" className="grid scroll-mt-40 gap-4 sm:scroll-mt-44">
                  <BracketSection
                    title={`${data.leagueLabel} Baum`}
                    rounds={data.bracketMatches}
                  />
                </section>
              ) : null}

              {remainingSections.map((section) => (
                <HomeSection key={section.key} section={section} />
              ))}
            </div>
          )}

          <footer className="mt-2 border-t border-white/10 px-1 pt-5 text-xs text-[#9eb4ab]">
            Datenquelle:{" "}
            <a
              href="https://www.openligadb.de/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#dcbc6e] underline underline-offset-2 transition-colors hover:text-[#f4efd6]"
            >
              OpenLigaDB
            </a>
            {" "}· Lizenz:{" "}
            <a
              href="https://www.openligadb.de/lizenz"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#72d9e4] underline underline-offset-2 transition-colors hover:text-[#dff9fb]"
            >
              openligadb.de/lizenz
            </a>
          </footer>
        </div>
      </main>
    </div>
  );
}
