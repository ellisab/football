import Link from "next/link";
import type { LeagueKey, LeagueOption } from "@footballleagues/core/leagues";
import { getLeagueLabel } from "@footballleagues/core/leagues";
import type { LucideIcon } from "lucide-react";
import { Flag, Goal, Globe2, Medal, Shirt, Shield, Trophy } from "lucide-react";
import { SectionKicker } from "./section-kicker";

const LEAGUE_ICONS: Record<LeagueKey, LucideIcon> = {
  bl1: Goal,
  bl2: Shirt,
  fbl1: Shield,
  fbl2: Shirt,
  cl: Trophy,
  dfb: Flag,
  wc: Globe2,
};

const buildHref = (league: LeagueKey, season: number) => {
  return `/?league=${league}&season=${season}`;
};

export function LeagueTabs({
  options,
  currentLeague,
  currentSeason,
  variant = "default",
}: {
  options: LeagueOption[];
  currentLeague: LeagueKey;
  currentSeason: number;
  variant?: "default" | "overlay";
}) {
  const isOverlay = variant === "overlay";
  const displayOptions = [...options].sort((a, b) => {
    if (a.shortcut === "wc") return -1;
    if (b.shortcut === "wc") return 1;
    return 0;
  });

  return (
    <section className={`grid min-w-0 gap-4 ${isOverlay ? "w-full max-w-full" : ""}`}>
      <SectionKicker>Wettbewerbe</SectionKicker>
      <div
        className={`flex min-w-0 max-w-full gap-3 ${
          isOverlay
            ? "overflow-x-auto overscroll-x-contain pb-2 pr-4 [scrollbar-width:none] lg:flex-wrap lg:overflow-x-visible lg:pr-0 [&::-webkit-scrollbar]:hidden"
            : "flex-wrap"
        }`}
      >
        {displayOptions.map((option) => {
          const isActive = option.shortcut === currentLeague;
          const Icon = LEAGUE_ICONS[option.shortcut] ?? Medal;
          const season = option.seasons[0] ?? currentSeason;

          return (
            <Link
              key={option.shortcut}
              href={buildHref(option.shortcut, season)}
              aria-current={isActive ? "page" : undefined}
              aria-label={`${getLeagueLabel(option.shortcut)} ${
                isActive ? "ausgewählt" : "öffnen"
              }`}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? "border-[#dcbc6e]/55 bg-[linear-gradient(135deg,rgba(10,44,38,0.74),rgba(21,49,54,0.62))] text-[#f4efd6] shadow-[0_18px_38px_rgba(4,15,20,0.22)]"
                  : "border-white/12 bg-white/[0.04] text-[#c8d7d0] hover:border-[#72d9e4]/35 hover:bg-white/[0.08] hover:text-[#f7fbf8]"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${isActive ? "text-[#dcbc6e]" : "text-[#72d9e4]"}`}
              />
              <span>{getLeagueLabel(option.shortcut)}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
