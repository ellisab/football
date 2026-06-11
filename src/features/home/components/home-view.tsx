import { BracketSection } from "@/features/champions-league/components/bracket-section";
import { StandingsCard } from "@/features/standings/components/standings-card";
import { WorldCupPanel } from "@/features/world-cup/components/world-cup-panel";
import type { WebHomeViewModel } from "../presenter/home-view-model";
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

const getPrimaryActionHref = (data: WebHomeViewModel) => {
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
  if (data.worldCup) {
    return data.worldCup.knockoutRounds.length > 0
      ? "#world-cup-knockout"
      : getPrimaryActionHref(data);
  }

  if (data.hasTable) {
    return "#table";
  }

  if (data.sections.some((section) => section.key === "next-round")) {
    return "#next-round";
  }

  return getPrimaryActionHref(data);
};

const getHeroHeadline = (data: WebHomeViewModel) => {
  if (data.worldCup) {
    return `${data.worldCup.leagueName} Spielplan & Tabellen`;
  }

  return data.hasTable
    ? `${data.leagueLabel} Spieltag & Tabelle`
    : `${data.leagueLabel} Spielplan & Ergebnisse`;
};

const getHeroImage = (data: WebHomeViewModel): HomeHeroImage => {
  if (data.resolvedLeague === "wc") {
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

const getHeroPreviewStats = (data: WebHomeViewModel): HomeHeroStat[] => {
  if (data.worldCup) {
    const groupCount = data.worldCup.groupSections.length;
    const matchCount = getWorldCupMatchCount(data.worldCup);

    return [
      {
        detail: data.worldCup.leagueName,
        label: "Saison",
        value: String(data.worldCup.season),
      },
      {
        detail: groupCount === 1 ? "Gruppe" : "Gruppen",
        label: "Gruppen",
        value: String(groupCount),
      },
      {
        detail: "OpenLigaDB",
        label: "Spiele",
        value: String(matchCount),
      },
    ];
  }

  const roundSection = data.sections.find((section) => section.renderKind !== "table");
  const tableSection = data.sections.find((section) => section.renderKind === "table");
  const roundMatchCount = roundSection ? roundSection.items.length : 0;
  const tableTeamCount =
    tableSection && tableSection.renderKind === "table" ? tableSection.items.length : 0;

  return [
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
    {
      detail: tableTeamCount > 0 ? "aktuell" : "noch leer",
      label: "Tabelle",
      value: tableTeamCount > 0 ? `${tableTeamCount} Teams` : "Offen",
    },
  ];
};

export function HomeView({ data }: { data: WebHomeViewModel }) {
  const primaryActionHref = getPrimaryActionHref(data);
  const secondaryActionHref = getSecondaryActionHref(data);
  const heroHeadline = getHeroHeadline(data);
  const heroImage = getHeroImage(data);
  const heroPreviewStats = getHeroPreviewStats(data);
  const nextRoundSections = data.sections.filter((section) => section.key === "next-round");
  const remainingSections = data.sections.filter((section) => section.key !== "next-round");

  return (
    <div className="poster-shell min-h-screen w-full text-[#edf6ef]">
      <main className="relative z-10">
        <HomeHero
          hasTable={data.hasTable}
          headline={heroHeadline}
          image={heroImage}
          leagueLabel={data.leagueLabel}
          leagueOptions={data.leagueOptions}
          currentLeague={data.resolvedLeague}
          currentSeason={data.resolvedSeason}
          primaryHref={primaryActionHref}
          previewStats={heroPreviewStats}
          season={data.resolvedSeason}
          secondaryHref={secondaryActionHref}
        />

        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:gap-10 lg:px-10">
          <ErrorBanner errors={data.visibleErrors} />

          {data.worldCup ? (
            <WorldCupPanel data={data.worldCup} selectedGroup={data.worldCupGroup} />
          ) : (
            <div className="grid gap-8 lg:gap-10">
              {nextRoundSections.map((section) =>
                section.renderKind === "table" ? (
                  <section
                    key={section.key}
                    id={section.key}
                    className="grid w-full min-w-0 scroll-mt-40 gap-3 sm:scroll-mt-44"
                  >
                    <SectionKicker>{section.kicker}</SectionKicker>
                    <StandingsCard table={section.items} emptyText={section.emptyText} />
                  </section>
                ) : (
                  <RoundSection key={section.key} section={section} />
                )
              )}

              {data.bracketMatches.length > 0 ? (
                <section id="bracket" className="grid scroll-mt-40 gap-4 sm:scroll-mt-44">
                  <BracketSection
                    title={`${data.leagueLabel} Baum`}
                    rounds={data.bracketMatches}
                  />
                </section>
              ) : null}

              {remainingSections.map((section) =>
                section.renderKind === "table" ? (
                  <section
                    key={section.key}
                    id={section.key}
                    className="grid w-full min-w-0 scroll-mt-40 gap-3 sm:scroll-mt-44"
                  >
                    <SectionKicker>{section.kicker}</SectionKicker>
                    <StandingsCard table={section.items} emptyText={section.emptyText} />
                  </section>
                ) : (
                  <RoundSection key={section.key} section={section} />
                )
              )}
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
