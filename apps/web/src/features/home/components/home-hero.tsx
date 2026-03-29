import { ArrowRight, CalendarDays, Goal, Medal, Trophy } from "lucide-react";

const getHeroDescription = ({
  leagueLabel,
  season,
  hasTable,
  hasBracket,
}: {
  leagueLabel: string;
  season: number;
  hasTable: boolean;
  hasBracket: boolean;
}) => {
  if (hasBracket) {
    return `${leagueLabel} ${season} mit Ergebnissen, K.-o.-Baum und den wichtigsten Duellen auf einer Seite.`;
  }

  if (hasTable) {
    return `${leagueLabel} ${season} mit Spieltag, Tabellenlage und allen schnellen Einstiegen direkt im ersten Viewport.`;
  }

  return `${leagueLabel} ${season} mit den neuesten Spielen und dem kompakten Rundenueberblick an einem Ort.`;
};

export function HomeHero({
  leagueLabel,
  season,
  hasTable,
  hasBracket,
  primaryHref,
  secondaryHref,
}: {
  leagueLabel: string;
  season: number;
  hasTable: boolean;
  hasBracket: boolean;
  primaryHref: string;
  secondaryHref: string;
}) {
  const description = getHeroDescription({
    leagueLabel,
    season,
    hasTable,
    hasBracket,
  });
  const showSecondaryAction = secondaryHref !== primaryHref;

  return (
    <section className="hero-panel overflow-hidden rounded-[2rem] border border-[#222530]">
      <div className="grid gap-5 px-5 py-6 sm:px-7 sm:py-8 lg:px-9">
        <div className="grid gap-5">
          <div className="grid gap-3">
            <div className="text-[0.74rem] font-bold tracking-[0.24em] uppercase text-[#ffd86b]">
              Matchday HQ
            </div>
            <div className="grid gap-3">
              <h1 className="max-w-[12ch] text-[2.9rem] leading-[0.92] font-[var(--font-stadium-heading)] uppercase text-white sm:text-[3.6rem]">
                Spieltag-Atlas
              </h1>
              <p className="max-w-[58ch] text-sm leading-6 text-[#e8ebf4] sm:text-[1rem]">
                {description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <span className="score-pill inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white">
              <Trophy className="h-4 w-4 text-[#ffd86b]" />
              {leagueLabel}
            </span>
            <span className="score-pill inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white">
              <CalendarDays className="h-4 w-4 text-[#72ffbc]" />
              Saison {season}
            </span>
            <span className="score-pill inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white">
              {hasTable ? (
                <Medal className="h-4 w-4 text-[#72ffbc]" />
              ) : (
                <Goal className="h-4 w-4 text-[#72ffbc]" />
              )}
              {hasTable ? "Tabelle live" : "Runde im Blick"}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={primaryHref}
              className="inline-flex items-center gap-2 rounded-full bg-[#f3f6fd] px-5 py-3 text-sm font-semibold text-[#11151e] transition-transform hover:-translate-y-0.5"
            >
              Zu den Spielen
              <ArrowRight className="h-4 w-4" />
            </a>
            {showSecondaryAction ? (
              <a
                href={secondaryHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
              >
                {hasTable ? "Zur Tabelle" : "Zum Ueberblick"}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
