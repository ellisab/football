import type { LeagueKey, LeagueOption } from "@footballleagues/core/leagues";
import {
  Flag,
  Globe2,
  Goal,
  Medal,
  Shield,
  Shirt,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type CompetitionMeta = {
  accentClass: string;
  category: "Men" | "Women" | "Global";
  href: string;
  icon: LucideIcon;
  label: string;
  shortLabel: string;
  slug: string;
};

export const COMPETITION_META: Record<LeagueKey, CompetitionMeta> = {
  wc: {
    accentClass: "from-[#f4efd6] via-[#dcbc6e] to-[#72d9e4]",
    category: "Global",
    href: "/competitions/world-cup",
    icon: Globe2,
    label: "FIFA World Cup",
    shortLabel: "World Cup",
    slug: "world-cup",
  },
  bl1: {
    accentClass: "from-[#ef5f5f] via-[#dcbc6e] to-[#121820]",
    category: "Men",
    href: "/competitions/bundesliga-1",
    icon: Goal,
    label: "Bundesliga 1",
    shortLabel: "Bundesliga 1",
    slug: "bundesliga-1",
  },
  bl2: {
    accentClass: "from-[#efaa57] via-[#f4efd6] to-[#43c886]",
    category: "Men",
    href: "/competitions/bundesliga-2",
    icon: Shirt,
    label: "Bundesliga 2",
    shortLabel: "Bundesliga 2",
    slug: "bundesliga-2",
  },
  fbl1: {
    accentClass: "from-[#f072b6] via-[#72d9e4] to-[#43c886]",
    category: "Women",
    href: "/competitions/women",
    icon: Shield,
    label: "Frauen-Bundesliga",
    shortLabel: "Women",
    slug: "women",
  },
  fbl2: {
    accentClass: "from-[#b78cff] via-[#72d9e4] to-[#f4efd6]",
    category: "Women",
    href: "/competitions/women-2",
    icon: Shirt,
    label: "2. Frauen-Bundesliga",
    shortLabel: "Women 2",
    slug: "women-2",
  },
  dfb: {
    accentClass: "from-[#43c886] via-[#f4efd6] to-[#050a0d]",
    category: "Men",
    href: "/competitions/dfb-pokal",
    icon: Flag,
    label: "DFB-Pokal",
    shortLabel: "DFB",
    slug: "dfb-pokal",
  },
  cl: {
    accentClass: "from-[#72d9e4] via-[#dcbc6e] to-[#8b8cff]",
    category: "Men",
    href: "/competitions/champions-league",
    icon: Trophy,
    label: "Champions League",
    shortLabel: "UCL",
    slug: "champions-league",
  },
};

export const getCompetitionMeta = (league: LeagueKey): CompetitionMeta => {
  return COMPETITION_META[league] ?? {
    accentClass: "from-[#dcbc6e] via-[#72d9e4] to-[#43c886]",
    category: "Global",
    href: "/",
    icon: Medal,
    label: league.toUpperCase(),
    shortLabel: league.toUpperCase(),
    slug: league,
  };
};

export const getCompetitionHref = (
  option: Pick<LeagueOption, "seasons" | "shortcut">,
  season?: number
) => {
  const resolvedSeason = season ?? option.seasons[0];
  const baseHref = getCompetitionMeta(option.shortcut).href;

  return resolvedSeason ? `${baseHref}?season=${resolvedSeason}` : baseHref;
};

export const getLeagueKeyFromSlug = (slug: string): LeagueKey | undefined => {
  return (Object.keys(COMPETITION_META) as LeagueKey[]).find(
    (key) => COMPETITION_META[key].slug === slug
  );
};

export const PRIMARY_NAV_ITEMS = [
  { href: "/today", label: "Today" },
  { href: "/competitions/world-cup", label: "World Cup" },
  { href: "/competitions/bundesliga-1", label: "Bundesliga 1" },
  { href: "/competitions/bundesliga-2", label: "Bundesliga 2" },
  { href: "/competitions/women", label: "Women" },
  { href: "/competitions/men", label: "Men" },
  { href: "/tables", label: "Tables" },
  { href: "/teams", label: "Teams" },
] as const;
