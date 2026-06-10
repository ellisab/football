import { BracketSection } from "@/features/champions-league/components/bracket-section";
import { StandingsCard } from "@/features/standings/components/standings-card";
import { WorldCupPanel } from "@/features/world-cup/components/world-cup-panel";
import type { WebHomeViewModel } from "../presenter/home-view-model";
import { ErrorBanner } from "./error-banner";
import { HomeHero } from "./home-hero";
import { RoundSection } from "./round-section";
import { SectionKicker } from "./section-kicker";

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

export function HomeView({ data }: { data: WebHomeViewModel }) {
  const primaryActionHref = getPrimaryActionHref(data);
  const secondaryActionHref = getSecondaryActionHref(data);
  const nextRoundSections = data.sections.filter((section) => section.key === "next-round");
  const remainingSections = data.sections.filter((section) => section.key !== "next-round");

  return (
    <div className="poster-shell min-h-screen w-full text-[#edf6ef]">
      <main className="relative z-10">
        <HomeHero
          hasTable={data.hasTable}
          leagueLabel={data.leagueLabel}
          leagueOptions={data.leagueOptions}
          currentLeague={data.resolvedLeague}
          currentSeason={data.resolvedSeason}
          primaryHref={primaryActionHref}
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
                className="grid w-full min-w-0 scroll-mt-28 gap-3"
              >
                <SectionKicker>{section.kicker}</SectionKicker>
                <StandingsCard table={section.items} />
              </section>
            ) : (
              <RoundSection key={section.key} section={section} />
            )
          )}

          {data.bracketMatches.length > 0 ? (
            <section id="bracket" className="grid scroll-mt-28 gap-4">
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
                className="grid w-full min-w-0 scroll-mt-28 gap-3"
              >
                <SectionKicker>{section.kicker}</SectionKicker>
                <StandingsCard table={section.items} />
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
