import Link from "next/link";
import type { LeagueKey, LeagueOption } from "@footballleagues/core/leagues";
import { getLeagueLabel } from "@footballleagues/core/leagues";
import { Activity, Medal } from "lucide-react";
import {
  getCompetitionHref,
  getCompetitionMeta,
} from "@/features/football/competition-meta";
import { SectionKicker } from "./section-kicker";

const buildHref = (league: LeagueKey, season: number) => {
  return getCompetitionHref({ shortcut: league, seasons: [season] }, season);
};

export function LeagueTabs({
  options,
  currentLeague,
  currentSeason,
  getHref,
  variant = "default",
}: {
  options: LeagueOption[];
  currentLeague?: LeagueKey;
  currentSeason: number;
  getHref?: (option: LeagueOption, season: number) => string;
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
          const meta = getCompetitionMeta(option.shortcut);
          const Icon = meta.icon ?? Medal;
          const season = option.seasons[0] ?? currentSeason;
          const href = getHref?.(option, season) ?? buildHref(option.shortcut, season);
          const label = meta.shortLabel || getLeagueLabel(option.shortcut);

          return (
            <Link
              key={option.shortcut}
              href={href}
              aria-current={isActive ? "page" : undefined}
              aria-label={`${getLeagueLabel(option.shortcut)} ${
                isActive ? "ausgewählt" : "öffnen"
              }`}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? "border-[#dcbc6e]/55 bg-[linear-gradient(135deg,rgba(10,44,38,0.78),rgba(21,49,54,0.68))] text-[#f4efd6] shadow-[0_18px_38px_rgba(4,15,20,0.22)]"
                  : "border-white/12 bg-white/[0.045] text-[#c8d7d0] hover:border-[#72d9e4]/35 hover:bg-white/[0.08] hover:text-[#f7fbf8]"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${isActive ? "text-[#dcbc6e]" : "text-[#72d9e4]"}`}
              />
              <span>{label}</span>
              <span className="hidden items-center gap-1 rounded-full bg-white/[0.07] px-2 py-0.5 text-[0.66rem] uppercase tracking-[0.12em] text-[#9fb6ad] sm:inline-flex">
                <Activity className="h-3 w-3" />
                {meta.category}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
