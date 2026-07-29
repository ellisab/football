"use client";

import { Star, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FavoriteButton, useFavorites } from "@/features/favorites";
import {
  type MatchCardItem,
  MatchCardList,
} from "@/features/football/components/match-card-list";
import type { SearchResultItem } from "@/features/search";

export type FavoriteMatchItem = MatchCardItem & {
  teamIds: string[];
};

const MATCH_PAGE_SIZE = 12;

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
  const favoritesKey = JSON.stringify([
    favorites.competitionIds,
    favorites.teamIds,
  ]);
  const [matchReveal, setMatchReveal] = useState({
    favoritesKey: "",
    visibleCount: MATCH_PAGE_SIZE,
  });
  const favoriteCompetitions = competitions.filter((item) =>
    favorites.competitionIds.includes(item.id),
  );
  const favoriteTeams = teams.filter((item) =>
    favorites.teamIds.includes(item.id),
  );
  const relevantMatches = matches.filter(
    (match) =>
      favorites.competitionIds.includes(match.competitionId) ||
      match.teamIds.some((id) => favorites.teamIds.includes(id)),
  );
  const requestedMatchCount =
    matchReveal.favoritesKey === favoritesKey
      ? matchReveal.visibleCount
      : MATCH_PAGE_SIZE;
  const visibleMatches = relevantMatches.slice(0, requestedMatchCount);
  const remainingMatchCount = relevantMatches.length - visibleMatches.length;
  const nextMatchCount = Math.min(MATCH_PAGE_SIZE, remainingMatchCount);
  const isEmpty =
    favoriteCompetitions.length === 0 && favoriteTeams.length === 0;

  return (
    <div className="page-shell match-feed-page favorites-page">
      <div className="content-column">
        <header className="page-intro">
          <div>
            <p className="eyebrow">Lokal auf diesem Gerät</p>
            <h1 className="page-title">Favoriten</h1>
            <p className="page-description">
              Deine Teams und Wettbewerbe bleiben in diesem Browser gespeichert.
              Ein Konto ist nicht nötig.
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
                Markiere einen Wettbewerb oder ein Team mit dem Stern. Deine
                Auswahl erscheint anschließend hier.
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
                  <Trophy
                    aria-hidden="true"
                    className="h-5 w-5 text-[var(--text-soft)]"
                  />
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
                  <Users
                    aria-hidden="true"
                    className="h-5 w-5 text-[var(--text-soft)]"
                  />
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
                <div id="favorite-relevant-matches">
                  <MatchCardList matches={visibleMatches} />
                </div>
                {relevantMatches.length > MATCH_PAGE_SIZE ? (
                  <div className="match-list-pagination">
                    <p aria-live="polite">
                      <strong>{visibleMatches.length}</strong> von{" "}
                      {relevantMatches.length} Spielen
                    </p>
                    {remainingMatchCount > 0 ? (
                      <button
                        aria-controls="favorite-relevant-matches"
                        className="button-secondary"
                        onClick={() =>
                          setMatchReveal({
                            favoritesKey,
                            visibleCount:
                              visibleMatches.length + nextMatchCount,
                          })
                        }
                        type="button"
                      >
                        Weitere {nextMatchCount}{" "}
                        {nextMatchCount === 1 ? "Spiel" : "Spiele"} anzeigen
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
