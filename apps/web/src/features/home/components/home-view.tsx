import { BracketSection } from "@/features/champions-league/components/bracket-section";
import { StandingsCard } from "@/features/standings/components/standings-card";
import type { WebHomeViewModel } from "../presenter/home-view-model";
import { ErrorBanner } from "./error-banner";
import { LeagueTabs } from "./league-tabs";
import { QuickActions } from "./quick-actions";
import { RoundSection } from "./round-section";

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
    <div className="min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_10%_0%,rgba(61,255,160,0.15)_0%,transparent_35%),linear-gradient(180deg,#0b0d12_0%,#11151e_100%)] text-[#f3f6fd]">
      <main className="mx-auto flex w-full max-w-[1220px] flex-col gap-10 px-3 pb-14 pt-5 sm:px-5 sm:pb-20">
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-[var(--font-stadium-heading)] uppercase tracking-[0.04em] sm:text-4xl">
                Stadium Edition
              </h1>
            </div>
          </div>
        </section>

        <LeagueTabs
          options={data.leagueOptions}
          currentLeague={data.resolvedLeague}
          currentSeason={data.resolvedSeason}
        />
        <QuickActions
          hasTable={data.hasTable}
          primaryHref={primaryActionHref}
          secondaryHref={secondaryActionHref}
        />
        <ErrorBanner errors={data.visibleErrors} />

        {nextRoundSections.map((section) =>
          section.renderKind === "table" ? (
            <section key={section.key} id={section.key} className="grid w-full min-w-0 gap-4">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#3dffa0]">
                {section.kicker}
              </div>
              <StandingsCard table={section.items} />
            </section>
          ) : (
            <RoundSection key={section.key} section={section} />
          )
        )}

        {data.resolvedLeague === "cl" ? (
          <section id="bracket" className="grid gap-4">
            <BracketSection rounds={data.bracketMatches} />
          </section>
        ) : null}

        {remainingSections.map((section) =>
          section.renderKind === "table" ? (
            <section key={section.key} id={section.key} className="grid w-full min-w-0 gap-4">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#3dffa0]">
                {section.kicker}
              </div>
              <StandingsCard table={section.items} />
            </section>
          ) : (
            <RoundSection key={section.key} section={section} />
          )
        )}

        <footer className="mt-2 border-t border-[#1f2431] pt-4 text-xs text-[#8e97ab]">
          Data source:{" "}
          <a
            href="https://www.openligadb.de/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[#3dffa0] underline underline-offset-2 hover:text-[#72ffbc]"
          >
            OpenLigaDB
          </a>
          {" "}· License:{" "}
          <a
            href="https://www.openligadb.de/lizenz"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[#3dffa0] underline underline-offset-2 hover:text-[#72ffbc]"
          >
            openligadb.de/lizenz
          </a>
        </footer>
      </main>
    </div>
  );
}
