import { ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "@/features/favorites";
import { getCompetitionCatalog } from "@/features/football/competition-meta";
import {
  EmptyState,
  PageIntro,
} from "@/features/football/components/product-ui";
import { SearchField } from "@/features/football/components/search-field";

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("de-DE")
    .trim();

export function CompetitionDirectory({ query = "" }: { query?: string }) {
  const normalizedQuery = normalize(query);
  const competitions = getCompetitionCatalog().filter((competition) => {
    if (!normalizedQuery) return true;
    return normalize(
      `${competition.label} ${competition.shortLabel} ${competition.region} ${competition.category}`,
    ).includes(normalizedQuery);
  });

  return (
    <div className="page-shell">
      <div className="wide-column">
        <PageIntro
          eyebrow="Verzeichnis"
          title="Wettbewerbe"
          description="Alle unterstützten Ligen und Turniere, direkt mit Spieltagen, Ergebnissen und verfügbaren Tabellen."
        />

        <form
          action="/competitions"
          method="get"
          className="mb-6"
          role="search"
        >
          <SearchField
            inputId="competition-query"
            name="q"
            defaultValue={query}
            placeholder="Wettbewerb oder Region"
            label="Wettbewerbe durchsuchen"
          />
        </form>

        <p className="sr-only" aria-live="polite">
          {competitions.length} Wettbewerbe gefunden.
        </p>

        {competitions.length > 0 ? (
          <section
            className="competition-grid"
            aria-label="Unterstützte Wettbewerbe"
          >
            {competitions.map((competition) => {
              const Icon = competition.icon;
              return (
                <article key={competition.key} className="competition-card">
                  <div className="competition-card-header">
                    <span className="competition-mark" aria-hidden="true">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="meta-chip">{competition.category}</span>
                      <FavoriteButton
                        kind="competition"
                        id={competition.key}
                        label={competition.label}
                        showLabel={false}
                        className="favorite-icon-button"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="eyebrow">{competition.region}</p>
                    <h2>{competition.label}</h2>
                    <p>{competition.description}</p>
                  </div>
                  <Link
                    href={competition.href}
                    className="competition-card-link"
                  >
                    Öffnen
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </section>
        ) : (
          <EmptyState
            title="Kein Wettbewerb gefunden"
            description={`Für „${query}“ gibt es keinen Treffer. Versuche einen Ligennamen, ein Kürzel oder eine Region.`}
            actionHref="/competitions"
            actionLabel="Alle Wettbewerbe"
            icon={<Trophy aria-hidden="true" className="h-5 w-5" />}
          />
        )}
      </div>
    </div>
  );
}
