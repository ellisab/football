import Image from "next/image";
import Link from "next/link";
import type { LeagueKey, LeagueOption } from "@footballleagues/core/leagues";
import { ArrowRight } from "lucide-react";
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
  currentLeague: LeagueKey;
  currentSeason: number;
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

        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1240px] flex-col px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-10">
          <div className="w-full">
            <LeagueTabs
              options={leagueOptions}
              currentLeague={currentLeague}
              currentSeason={currentSeason}
              variant="overlay"
            />
          </div>

          <div className="flex flex-1 items-center pt-6 sm:items-start sm:pt-4">
            <div className="mx-auto grid max-w-[22rem] gap-4 text-center sm:mx-0 sm:max-w-[42rem] sm:text-left">
              <h1 className="text-[2.45rem] leading-[0.88] font-[var(--font-stadium-heading)] uppercase tracking-[0.03em] text-[#f4efd6] [text-shadow:0_0_30px_rgba(2,9,12,0.36)] sm:max-w-[11.5ch] sm:text-[3.25rem] lg:text-[3.9rem]">
                {headline}
              </h1>
              <p className="max-w-[34rem] text-sm leading-6 text-[#dce9e2] sm:text-base sm:leading-7">
                {leagueLabel} · Saison {season}. Live-Ergebnisse, Tabellen und
                K.-o.-Runden in einer klaren Ansicht vom ersten Anpfiff bis zum
                letzten Tor.
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

              <div
                className="grid grid-cols-3 gap-2 rounded-[1.35rem] border border-white/10 bg-[#071116]/62 p-2 shadow-[0_18px_42px_rgba(2,9,12,0.28)] backdrop-blur-md sm:max-w-[38rem]"
                aria-label="Kurzueberblick"
              >
                {previewStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="min-w-0 rounded-[1rem] border border-white/10 bg-white/[0.055] px-3 py-2 text-left"
                  >
                    <div className="truncate text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#9eb4ab]">
                      {stat.label}
                    </div>
                    <div className="mt-1 truncate text-base font-semibold text-[#f4efd6] sm:text-lg">
                      {stat.value}
                    </div>
                    {stat.detail ? (
                      <div className="mt-0.5 truncate text-[0.68rem] text-[#b6cbc2] sm:text-xs">
                        {stat.detail}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
