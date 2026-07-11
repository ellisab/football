"use client";

import Link from "next/link";
import { Star, Trophy, Users } from "lucide-react";
import type { SearchResultItem } from "@/features/search";
import { FavoriteButton, useFavorites } from "@/features/favorites";

export type FavoriteMatchItem = {
  competitionId: string;
  href: string;
  id: string;
  label: string;
  status: string;
  teamIds: string[];
};

export function FavoritesView({
  competitions,
  matches,
  teams,
}: {
  competitions: SearchResultItem[];
  matches: FavoriteMatchItem[];
  teams: SearchResultItem[];
}) {
  const favorites = useFavorites();
  const favoriteCompetitions = competitions.filter((item) =>
    favorites.competitionIds.includes(item.id)
  );
  const favoriteTeams = teams.filter((item) => favorites.teamIds.includes(item.id));
  const relevantMatches = matches.filter(
    (match) =>
      favorites.competitionIds.includes(match.competitionId) ||
      match.teamIds.some((id) => favorites.teamIds.includes(id))
  );
  const isEmpty = favoriteCompetitions.length === 0 && favoriteTeams.length === 0;

  return (
    <div className="page-shell">
      <div className="content-column">
        <header className="page-intro">
          <div>
            <p className="eyebrow">Lokal auf diesem Gerät</p>
            <h1 className="page-title">Favoriten</h1>
            <p className="page-description">
              Deine Teams und Wettbewerbe bleiben in diesem Browser gespeichert. Ein
              Konto ist nicht nötig.
            </p>
          </div>
        </header>

        {isEmpty ? (
          <section className="empty-state">
            <div className="empty-state-icon">
              <Star aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text)]">
                Noch keine Favoriten
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                Markiere einen Wettbewerb oder ein Team mit dem Stern. Deine Auswahl
                erscheint anschließend hier.
              </p>
            </div>
            <Link href="/competitions" className="button-primary">
              Wettbewerbe entdecken
            </Link>
          </section>
        ) : (
          <div className="grid gap-9">
            {favoriteCompetitions.length > 0 ? (
              <section className="content-section">
                <div className="section-heading-row">
                  <div>
                    <h2 className="section-title">Wettbewerbe</h2>
                    <p className="section-description">
                      Direkt zu Spieltagen, Ergebnissen und Tabellen.
                    </p>
                  </div>
                  <Trophy aria-hidden="true" className="h-5 w-5 text-[var(--text-soft)]" />
                </div>
                <ul className="favorite-list">
                  {favoriteCompetitions.map((item) => (
                    <li key={item.id}>
                      <Link href={item.href}>
                        <strong>{item.label}</strong>
                        <span>{item.description}</span>
                      </Link>
                      <FavoriteButton
                        kind="competition"
                        id={item.id}
                        label={item.label}
                        showLabel={false}
                        className="favorite-icon-button"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {favoriteTeams.length > 0 ? (
              <section className="content-section">
                <div className="section-heading-row">
                  <div>
                    <h2 className="section-title">Teams</h2>
                    <p className="section-description">
                      Nächste Spiele und aktueller Tabellenkontext.
                    </p>
                  </div>
                  <Users aria-hidden="true" className="h-5 w-5 text-[var(--text-soft)]" />
                </div>
                <ul className="favorite-list">
                  {favoriteTeams.map((item) => (
                    <li key={item.id}>
                      <Link href={item.href}>
                        <strong>{item.label}</strong>
                        <span>{item.description}</span>
                      </Link>
                      <FavoriteButton
                        kind="team"
                        id={item.id}
                        label={item.label}
                        showLabel={false}
                        className="favorite-icon-button"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {relevantMatches.length > 0 ? (
              <section className="content-section">
                <div className="section-heading-row">
                  <div>
                    <h2 className="section-title">Relevante Spiele</h2>
                    <p className="section-description">
                      Aus dem aktuell geladenen Spieltagsausschnitt.
                    </p>
                  </div>
                </div>
                <ul className="favorite-match-list">
                  {relevantMatches.slice(0, 12).map((match) => (
                    <li key={match.id}>
                      <Link href={match.href}>
                        <strong>{match.label}</strong>
                        <span>{match.status}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
