import { BracketSection } from "@/features/champions-league/components/bracket-section";
import { StandingsCard } from "@/features/standings/components/standings-card";
import type { WebHomeViewModel } from "../presenter/home-view-model";
import { ErrorBanner } from "./error-banner";
import { HomeHero } from "./home-hero";
import { LeagueTabs } from "./league-tabs";
import { RoundSection } from "./round-section";
import { SectionKicker } from "./section-kicker";

const getPrimaryActionHref = (data: WebHomeViewModel) => {
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
    <div className="poster-shell min-h-screen w-full overflow-x-hidden text-[#fff2fb]">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-24 h-72 w-72 rounded-full bg-[#ff9953]/18 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute right-[-12%] top-52 h-72 w-72 rounded-full bg-[#57ebff]/12 blur-3xl sm:h-[26rem] sm:w-[26rem]" />
        <div className="absolute bottom-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#ff5c9a]/14 blur-3xl sm:h-96 sm:w-96" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-3 pb-14 pt-5 sm:px-5 sm:pb-20 sm:pt-6">
        <LeagueTabs
          options={data.leagueOptions}
          currentLeague={data.resolvedLeague}
          currentSeason={data.resolvedSeason}
        />
        <div className="grid gap-6 lg:gap-7">
          <HomeHero
            hasTable={data.hasTable}
            primaryHref={primaryActionHref}
            secondaryHref={secondaryActionHref}
          />
          <ErrorBanner errors={data.visibleErrors} />

          {nextRoundSections.map((section) =>
            section.renderKind === "table" ? (
              <section key={section.key} id={section.key} className="grid w-full min-w-0 gap-3">
                <SectionKicker>{section.kicker}</SectionKicker>
                <StandingsCard table={section.items} />
              </section>
            ) : (
              <RoundSection key={section.key} section={section} />
            )
          )}

          {data.bracketMatches.length > 0 ? (
            <section id="bracket" className="grid gap-4">
              <BracketSection
                title={`${data.leagueLabel} Baum`}
                rounds={data.bracketMatches}
              />
            </section>
          ) : null}

          {remainingSections.map((section) =>
            section.renderKind === "table" ? (
              <section key={section.key} id={section.key} className="grid w-full min-w-0 gap-3">
                <SectionKicker>{section.kicker}</SectionKicker>
                <StandingsCard table={section.items} />
              </section>
            ) : (
              <RoundSection key={section.key} section={section} />
            )
          )}
        </div>

        <footer className="poster-surface mt-2 rounded-[1.6rem] px-4 py-4 text-xs text-[#e3b7cf] sm:px-5">
          Datenquelle:{" "}
          <a
            href="https://www.openligadb.de/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[#ffd66c] underline underline-offset-2 transition-colors hover:text-[#fff6d0]"
          >
            OpenLigaDB
          </a>
          {" "}· Lizenz:{" "}
          <a
            href="https://www.openligadb.de/lizenz"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[#57ebff] underline underline-offset-2 transition-colors hover:text-[#d9fbff]"
          >
            openligadb.de/lizenz
          </a>
        </footer>
      </main>
    </div>
  );
}
