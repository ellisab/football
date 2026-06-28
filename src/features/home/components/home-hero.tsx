import Image from "next/image";
import Link from "next/link";
import type { LeagueKey, LeagueOption } from "@footballleagues/core/leagues";
import { ArrowRight, Radio, Trophy } from "lucide-react";
import { LeagueTabs } from "./league-tabs";

export type HomeHeroImage = {
  alt: string;
  src: string;
  variant: "league" | "world-cup";
};

export type HomeHeroStat = {
  detail?: string;
  label: string;
  value: string;
};

export function HomeHero({
  hasTable,
  headline,
  image,
  leagueLabel,
  leagueOptions,
  currentLeague,
  currentSeason,
  description,
  getLeagueHref,
  primaryHref,
  previewStats,
  season,
  secondaryHref,
}: {
  hasTable: boolean;
  headline: string;
  image: HomeHeroImage;
  leagueLabel: string;
  leagueOptions: LeagueOption[];
  currentLeague?: LeagueKey;
  currentSeason: number;
  description?: string;
  getLeagueHref?: (option: LeagueOption, season: number) => string;
  primaryHref: string;
  previewStats: HomeHeroStat[];
  season: number;
  secondaryHref: string;
}) {
  const showSecondaryAction = hasTable && secondaryHref !== primaryHref;

  return (
    <section id="spieltag-hero" className="atlas-hero">
      <div className="atlas-hero-frame">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          sizes="100vw"
          className={`atlas-hero-image ${
            image.variant === "league" ? "atlas-hero-image--league" : ""
          }`}
        />
        <div aria-hidden className="atlas-hero-grid" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-6.5rem)] w-full max-w-[1240px] flex-col px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-10 lg:px-10">
          <div className="w-full">
            <LeagueTabs
              options={leagueOptions}
              currentLeague={currentLeague}
              currentSeason={currentSeason}
              getHref={getLeagueHref}
              variant="overlay"
            />
          </div>

          <div className="grid flex-1 items-center gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:pt-12">
            <div className="mx-auto grid max-w-[22rem] gap-4 text-center sm:mx-0 sm:max-w-[45rem] sm:text-left">
              <div className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-[#071116]/62 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#dcbc6e] backdrop-blur-md sm:mx-0">
                <Radio className="h-3.5 w-3.5 text-[#72d9e4]" />
                Tagesanstoß
              </div>
              <h1 className="text-[2.75rem] leading-[0.86] font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f4efd6] [text-shadow:0_0_30px_rgba(2,9,12,0.36)] sm:max-w-[12ch] sm:text-[4.4rem] lg:text-[5.4rem]">
                {headline}
              </h1>
              <p className="max-w-[38rem] text-sm leading-6 text-[#dce9e2] sm:text-base sm:leading-7">
                {description ??
                  (hasTable
                    ? `${leagueLabel} · Saison ${season}. Ergebnisse zuerst, Tabellen direkt daneben und jeder Spielstatus vom Anstoß bis zum Abpfiff sichtbar.`
                    : `${leagueLabel} · Saison ${season}. Ergebnisse, kommende Spiele und jeder Status vom Anstoß bis zum Abpfiff sichtbar.`)}
              </p>

              <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(94deg,#f4efd6_0%,#dcbc6e_46%,#efaa57_100%)] px-5 py-3 text-sm font-semibold text-[#081116] shadow-[0_20px_45px_rgba(8,17,22,0.36)] transition-transform duration-300 hover:-translate-y-0.5"
                >
                  Zu den Spielen
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {showSecondaryAction ? (
                  <Link
                    href={secondaryHref}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-[#eef6ef] backdrop-blur-md transition-colors duration-300 hover:bg-white/[0.11]"
                  >
                    Zur Tabelle
                  </Link>
                ) : null}
              </div>
            </div>

            <aside
              className="poster-surface mx-auto grid w-full max-w-[23rem] gap-2 rounded-[1.35rem] border border-white/10 bg-[#071116]/66 p-3 shadow-[0_18px_42px_rgba(2,9,12,0.28)] backdrop-blur-md sm:grid-cols-3 lg:mx-0 lg:grid-cols-1"
              aria-label="Kurzueberblick"
            >
              <div className="flex items-center gap-2 px-2 py-1 sm:col-span-3 lg:col-span-1">
                <Trophy className="h-4 w-4 text-[#dcbc6e]" />
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#9eb4ab]">
                  Spieltag-Zentrale
                </span>
              </div>
              {previewStats.map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-0 rounded-[1rem] border border-white/10 bg-white/[0.055] px-3 py-3 text-left"
                >
                  <div className="truncate text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#9eb4ab]">
                    {stat.label}
                  </div>
                  <div className="mt-1 truncate font-mono text-2xl font-bold text-[#f4efd6]">
                    {stat.value}
                  </div>
                  {stat.detail ? (
                    <div className="mt-0.5 truncate text-[0.68rem] text-[#b6cbc2] sm:text-xs">
                      {stat.detail}
                    </div>
                  ) : null}
                </div>
              ))}
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
