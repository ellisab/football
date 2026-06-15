import { BracketSection } from "@/features/champions-league/components/bracket-section";
import { StandingsCard } from "@/features/standings/components/standings-card";
import { WorldCupPanel } from "@/features/world-cup/components/world-cup-panel";
import {
  getBerlinDateKey,
  isMatchOnBerlinDate,
} from "@footballleagues/core/matches";
import { getFinalResult, type ApiMatch } from "@footballleagues/core/openligadb";
import { Clock3, Goal, Trophy } from "lucide-react";
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

type TodayMatch = {
  competition: WebCompetitionViewModel;
  match: ApiMatch;
};

const timeFormatter = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

const todayLabelFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Berlin",
  weekday: "long",
});

const getMatchTime = (match: ApiMatch) => {
  const timestamp = Date.parse(match.matchDateTimeUTC ?? match.matchDateTime ?? "");
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

const getMatchIdentity = (match: ApiMatch) => {
  return [
    match.matchID,
    match.matchDateTimeUTC ?? match.matchDateTime,
    match.team1?.teamId ?? match.team1?.teamName,
    match.team2?.teamId ?? match.team2?.teamName,
  ]
    .filter(Boolean)
    .join("-");
};

const getTeamLabel = (team: ApiMatch["team1"], fallback: string) => {
  return team?.teamName ?? team?.shortName ?? fallback;
};

const formatMatchTime = (match: ApiMatch) => {
  const value = match.matchDateTimeUTC ?? match.matchDateTime;
  if (!value) return "offen";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "offen";

  return timeFormatter.format(date);
};

const formatTodayLabel = (date: Date) => {
  return todayLabelFormatter.format(date);
};

const getCompetitionMatches = (competition: WebCompetitionViewModel): ApiMatch[] => {
  const sectionMatches = competition.sections.flatMap((section) => {
    if (section.renderKind === "matches") return section.items;
    if (section.renderKind === "ties") {
      return section.items.flatMap((tie) => tie.matches);
    }

    return [];
  });
  const bracketMatches = competition.bracketMatches.flatMap((round) => round.matches);
  const worldCupMatches = competition.worldCup
    ? [
        ...competition.worldCup.groupSections.flatMap((section) => section.matches),
        ...competition.worldCup.knockoutRounds.flatMap((round) => round.matches),
      ]
    : [];

  return [...sectionMatches, ...bracketMatches, ...worldCupMatches];
};

const getTodayMatches = ({
  competitions,
  dateKey,
}: {
  competitions: WebCompetitionViewModel[];
  dateKey: string;
}) => {
  const seen = new Set<string>();
  const matches: TodayMatch[] = [];

  for (const competition of competitions) {
    for (const match of getCompetitionMatches(competition)) {
      if (!isMatchOnBerlinDate(match, dateKey)) continue;

      const identity = `${competition.resolvedLeague}-${getMatchIdentity(match)}`;
      if (seen.has(identity)) continue;

      seen.add(identity);
      matches.push({ competition, match });
    }
  }

  return [...matches].sort((a, b) => {
    const byTime = getMatchTime(a.match) - getMatchTime(b.match);
    if (byTime !== 0) return byTime;

    return a.competition.leagueLabel.localeCompare(b.competition.leagueLabel);
  });
};

const getUpcomingCompetitionMatchCount = (competition: WebCompetitionViewModel) => {
  return getCompetitionMatches(competition).filter(
    (match) => match.matchIsFinished !== true
  ).length;
};

const getCompetitionNextKickoff = (competition: WebCompetitionViewModel) => {
  return getCompetitionMatches(competition)
    .filter((match) => match.matchIsFinished !== true)
    .map(getMatchTime)
    .sort((a, b) => a - b)[0];
};

const hasCompetitionTable = (competition: WebCompetitionViewModel) => {
  if (competition.hasTable) return true;

  return (
    competition.worldCup?.groupSections.some((section) => section.table.length > 0) ??
    false
  );
};

const sortOverviewCompetitions = (competitions: WebCompetitionViewModel[]) => {
  return competitions
    .map((competition, index) => ({
      competition,
      index,
      nextKickoff: getCompetitionNextKickoff(competition),
    }))
    .sort((a, b) => {
      const aHasUpcoming = typeof a.nextKickoff === "number";
      const bHasUpcoming = typeof b.nextKickoff === "number";

      if (aHasUpcoming && bHasUpcoming) {
        const byKickoff = (a.nextKickoff as number) - (b.nextKickoff as number);
        if (byKickoff !== 0) return byKickoff;
      }

      if (aHasUpcoming !== bHasUpcoming) return aHasUpcoming ? -1 : 1;

      return a.index - b.index;
    })
    .map(({ competition }) => competition);
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
    return "Alle Spiele & Tabellen";
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
      src: "/images/world-cup-trophy-hero.webp",
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

function TodayMatchRow({
  item,
}: {
  item: TodayMatch;
}) {
  const { competition, match } = item;
  const finalResult = getFinalResult(match);
  const score = finalResult
    ? `${finalResult.pointsTeam1 ?? 0}:${finalResult.pointsTeam2 ?? 0}`
    : "-:-";
  const status = match.matchIsFinished ? "Beendet" : "Anstehend";

  return (
    <li
      className="grid min-w-0 gap-3 border-t border-white/10 px-4 py-3 first:border-t-0 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-center sm:px-5"
    >
      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#f4efd6]">
        <Clock3 className="h-4 w-4 shrink-0 text-[#72d9e4]" />
        <span>{formatMatchTime(match)}</span>
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-[#9eb4ab]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#dcbc6e]">
            <Trophy className="h-3.5 w-3.5" />
            {competition.leagueLabel}
          </span>
          <span>{status}</span>
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
    </li>
  );
}

function TodayMatchesSection({
  leagueLabel,
  matches,
  todayLabel,
}: {
  leagueLabel: string;
  matches: TodayMatch[];
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
  const todayDateKey = getBerlinDateKey(today) ?? "";
  const todayMatches = todayDateKey
    ? getTodayMatches({
        competitions: visibleCompetitions,
        dateKey: todayDateKey,
      })
    : [];
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
              ? (option) => `#league-${option.shortcut}`
              : undefined
          }
          primaryHref={primaryActionHref}
          previewStats={heroPreviewStats}
          season={data.resolvedSeason}
          secondaryHref={secondaryActionHref}
        />

        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:gap-10 lg:px-10">
          <ErrorBanner errors={data.visibleErrors} />
          <TodayMatchesSection
            leagueLabel={data.leagueLabel}
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
