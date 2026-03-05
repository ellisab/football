import Link from "next/link";
import type { LeagueKey, LeagueOption } from "@footballleagues/core/leagues";
import { getLeagueLabel } from "@footballleagues/core/leagues";
import type { LucideIcon } from "lucide-react";
import { Flag, Goal, Medal, Shirt, Shield, Trophy } from "lucide-react";

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
    <section className="grid gap-4">
      <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#3dffa0]">
        Categories
      </div>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const isActive = option.shortcut === currentLeague;
          const Icon = LEAGUE_ICONS[option.shortcut] ?? Medal;
          const season = option.seasons[0] ?? currentSeason;

          return (
            <Link
              key={option.shortcut}
              href={buildHref(option.shortcut, season)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-[#3dffa0] bg-[#1a3a2a] text-[#3dffa0]"
                  : "border-[#232937] bg-[#141922] text-[#a5aec2] hover:border-[#2f3645] hover:bg-[#19202b]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{getLeagueLabel(option.shortcut)}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
