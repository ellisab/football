import { StandingsCard } from "@/features/standings/components/standings-card";
import { WorldCupPanel } from "@/features/world-cup/components/world-cup-panel";
import type { WebCompetitionViewModel } from "@/features/home/presenter/home-view-model";
import {
  getCompetitionMeta,
} from "@/features/football/competition-meta";
import { hasCompetitionTable } from "@/features/football/view-utils";
import { RouteFrame } from "./route-frame";

export function TablesView({
  competitions,
}: {
  competitions: WebCompetitionViewModel[];
}) {
  const tableCompetitions = competitions.filter(hasCompetitionTable);

  return (
    <RouteFrame
      eyebrow="Tabellen"
      title="Liga-Rennen"
      description="Alle verfügbaren Tabellen in einer besonders lesbaren Ansicht, mit Qualifikation, Aufstieg und Gefahrenzone für schnelles Erfassen."
    >
      <div className="grid gap-8">
        {tableCompetitions.length === 0 ? (
          <section className="poster-empty rounded-[1.25rem] p-5 text-sm leading-6 text-[#a9c0b6]">
            Noch sind keine Tabellendaten verfügbar. Spielpläne und Matchseiten bleiben sichtbar.
          </section>
        ) : (
          tableCompetitions.map((competition) => {
            const meta = getCompetitionMeta(competition.resolvedLeague);
            const tableSection = competition.sections.find(
              (section) => section.renderKind === "table"
            );

            if (competition.worldCup) {
              return (
                <section
                  key={`${competition.resolvedLeague}-${competition.resolvedSeason}`}
                  className="grid gap-4"
                >
                  <div className="poster-empty rounded-[1.25rem] p-4">
                    <div className="section-kicker">{meta.label}</div>
                    <h2 className="mt-2 text-3xl leading-none font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f4efd6]">
                      WM-Gruppen
                    </h2>
                  </div>
                  <WorldCupPanel data={competition.worldCup} />
                </section>
              );
            }

            if (!tableSection || tableSection.renderKind !== "table") return null;

            return (
              <section
                key={`${competition.resolvedLeague}-${competition.resolvedSeason}`}
                className="grid scroll-mt-32 gap-3"
              >
                <div className="poster-empty flex flex-wrap items-end justify-between gap-3 rounded-[1.25rem] p-4">
                  <div>
                    <div className="section-kicker">{meta.category}</div>
                    <h2 className="mt-2 text-3xl leading-none font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f4efd6]">
                      {meta.label}
                    </h2>
                    <p className="mt-2 text-sm text-[#a9c0b6]">
                      Saison {competition.resolvedSeason}
                    </p>
                  </div>
                  <span
                    className={`h-1.5 w-32 rounded-full bg-gradient-to-r ${meta.accentClass}`}
                    aria-hidden
                  />
                </div>
                <StandingsCard table={tableSection.items} emptyText={tableSection.emptyText} />
              </section>
            );
          })
        )}
      </div>
    </RouteFrame>
  );
}
