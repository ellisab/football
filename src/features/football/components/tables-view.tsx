import Link from "next/link";
import { Table2 } from "lucide-react";
import { StandingsCard } from "@/features/standings/components/standings-card";
import type { WebCompetitionViewModel } from "@/features/home/presenter/home-view-model";
import { getCompetitionMeta } from "@/features/football/competition-meta";
import { hasCompetitionTable } from "@/features/football/view-utils";
import { EmptyState, PageIntro } from "@/features/football/components/product-ui";
import { FavoriteButton } from "@/features/favorites";

export function TablesView({
  competitions,
}: {
  competitions: WebCompetitionViewModel[];
}) {
  const tableCompetitions = competitions.filter(hasCompetitionTable);

  return (
    <div className="page-shell">
      <div className="wide-column">
        <PageIntro
          eyebrow="Wettbewerbsüberblick"
          title="Tabellen"
          description="Verlässliche Platzierungen und Saisonwerte, ohne pauschal abgeleitete Qualifikations- oder Abstiegszonen."
        />
        {tableCompetitions.length === 0 ? (
          <EmptyState
            title="Noch keine Tabellen"
            description="Für den geladenen Ausschnitt sind gerade keine Tabellendaten verfügbar. Spielpläne und Matchseiten bleiben erreichbar."
            actionHref="/competitions"
            actionLabel="Wettbewerbe öffnen"
            icon={<Table2 aria-hidden="true" className="h-5 w-5" />}
          />
        ) : (
          <div className="grid gap-10">
            {tableCompetitions.map((competition) => {
              const meta = getCompetitionMeta(competition.resolvedLeague);
              const tableSection = competition.sections.find(
                (section) => section.renderKind === "table"
              );
              if (!tableSection || tableSection.renderKind !== "table") return null;

              return (
                <section
                  key={`${competition.resolvedLeague}-${competition.resolvedSeason}`}
                  className="content-section"
                >
                  <div className="section-heading-row">
                    <div>
                      <p className="eyebrow">{meta.region}</p>
                      <h2 className="section-title">{meta.label}</h2>
                      <p className="section-description">
                        Saison {competition.resolvedSeason}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <FavoriteButton
                        kind="competition"
                        id={competition.resolvedLeague}
                        label={meta.label}
                        showLabel={false}
                        className="favorite-icon-button"
                      />
                      <Link
                        href={`${meta.href}?season=${competition.resolvedSeason}&view=standings`}
                        className="button-secondary"
                      >
                        Öffnen
                      </Link>
                    </div>
                  </div>
                  <StandingsCard
                    table={tableSection.items}
                    emptyText={tableSection.emptyText}
                  />
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
