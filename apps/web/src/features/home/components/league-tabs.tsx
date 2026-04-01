import Link from "next/link";
import type { LeagueKey, LeagueOption } from "@footballleagues/core/leagues";
import { getLeagueLabel } from "@footballleagues/core/leagues";
import type { LucideIcon } from "lucide-react";
import { Flag, Goal, Medal, Shirt, Shield, Trophy } from "lucide-react";
import { SectionKicker } from "./section-kicker";

const LEAGUE_ICONS: Record<LeagueKey, LucideIcon> = {
  bl1: Goal,
  bl2: Shirt,
  fbl1: Shield,
  fbl2: Shirt,
  cl: Trophy,
  dfb: Flag,
};

const buildHref = (league: LeagueKey, season: number) => {
  return `/?league=${league}&season=${season}`;
};

export function LeagueTabs({
  options,
  currentLeague,
  currentSeason,
}: {
  options: LeagueOption[];
  currentLeague: LeagueKey;
  currentSeason: number;
}) {
  return (
    <section className="poster-surface grid gap-3 rounded-[1.8rem] px-4 py-4 sm:px-5">
      <SectionKicker>Wettbewerbe</SectionKicker>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const isActive = option.shortcut === currentLeague;
          const Icon = LEAGUE_ICONS[option.shortcut] ?? Medal;
          const season = option.seasons[0] ?? currentSeason;

          return (
            <Link
              key={option.shortcut}
              href={buildHref(option.shortcut, season)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold shadow-[0_10px_24px_rgba(7,3,13,0.18)] transition-all ${
                isActive
                  ? "border-[#ffd66c]/55 bg-[linear-gradient(135deg,rgba(255,153,83,0.28),rgba(255,92,154,0.24),rgba(87,235,255,0.22))] text-[#fff6d0]"
                  : "border-white/10 bg-white/[0.05] text-[#efc9dd] hover:border-[#57ebff]/35 hover:bg-white/[0.08] hover:text-[#fff2fb]"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${isActive ? "text-[#ffd66c]" : "text-[#57ebff]"}`}
              />
              <span>{getLeagueLabel(option.shortcut)}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
