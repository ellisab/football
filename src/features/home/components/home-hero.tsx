import Image from "next/image";
import Link from "next/link";
import type { LeagueKey, LeagueOption } from "@footballleagues/core/leagues";
import { ArrowRight } from "lucide-react";
import { HeroParallaxController } from "./hero-parallax-controller";
import { LeagueTabs } from "./league-tabs";

export function HomeHero({
  hasTable,
  leagueLabel,
  leagueOptions,
  currentLeague,
  currentSeason,
  primaryHref,
  season,
  secondaryHref,
}: {
  hasTable: boolean;
  leagueLabel: string;
  leagueOptions: LeagueOption[];
  currentLeague: LeagueKey;
  currentSeason: number;
  primaryHref: string;
  season: number;
  secondaryHref: string;
}) {
  const showSecondaryAction = secondaryHref !== primaryHref;

  return (
    <section id="spieltag-hero" className="atlas-hero">
      <HeroParallaxController targetId="spieltag-hero" />
      <div className="atlas-hero-sticky">
        <Image
          src="/images/world-cup-trophy-hero.png"
          alt="Deutscher Fussballspieler mit dem WM-Pokal im Flutlichtstadion"
          fill
          priority
          sizes="100vw"
          className="atlas-hero-image"
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

          <div className="flex flex-1 items-center pt-10 sm:pt-12">
            <div className="mx-auto max-w-[20rem] text-center sm:mx-0 sm:max-w-[38rem] sm:text-left">
              <p className="max-w-[34rem] text-base leading-7 text-[#dce9e2] sm:text-[1.1rem] sm:leading-8">
                {leagueLabel} · Saison {season}. Live-Ergebnisse, Tabellen und
                K.-o.-Runden in einer klaren Ansicht vom ersten Anpfiff bis zum
                letzten Tor.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start">
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
                    {hasTable ? "Zur Tabelle" : "Zum Ueberblick"}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
