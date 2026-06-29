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
  category: "Männer" | "Frauen" | "Global";
  href: string;
  icon: LucideIcon;
  label: string;
  shortLabel: string;
  slug: string;
};

export const COMPETITION_META: Record<LeagueKey, CompetitionMeta> = {
  wc: {
    accentClass: "from-[#f5edc9] via-[#d8b86a] to-[#6eeaf2]",
    category: "Global",
    href: "/competitions/world-cup",
    icon: Globe2,
    label: "FIFA-Weltmeisterschaft",
    shortLabel: "WM",
    slug: "world-cup",
  },
  bl1: {
    accentClass: "from-[#f45f63] via-[#d8b86a] to-[#030708]",
    category: "Männer",
    href: "/competitions/bundesliga-1",
    icon: Goal,
    label: "Bundesliga",
    shortLabel: "Bundesliga",
    slug: "bundesliga-1",
  },
  bl2: {
    accentClass: "from-[#ffb45f] via-[#f5edc9] to-[#43c886]",
    category: "Männer",
    href: "/competitions/bundesliga-2",
    icon: Shirt,
    label: "2. Bundesliga",
    shortLabel: "2. Bundesliga",
    slug: "bundesliga-2",
  },
  fbl1: {
    accentClass: "from-[#f06fb4] via-[#6eeaf2] to-[#43c886]",
    category: "Frauen",
    href: "/competitions/women",
    icon: Shield,
    label: "Frauen-Bundesliga",
    shortLabel: "Frauen",
    slug: "women",
  },
  fbl2: {
    accentClass: "from-[#b890ff] via-[#6eeaf2] to-[#f5edc9]",
    category: "Frauen",
    href: "/competitions/women-2",
    icon: Shirt,
    label: "2. Frauen-Bundesliga",
    shortLabel: "Frauen 2",
    slug: "women-2",
  },
  dfb: {
    accentClass: "from-[#43c886] via-[#f5edc9] to-[#030708]",
    category: "Männer",
    href: "/competitions/dfb-pokal",
    icon: Flag,
    label: "DFB-Pokal",
    shortLabel: "DFB",
    slug: "dfb-pokal",
  },
  cl: {
    accentClass: "from-[#6eeaf2] via-[#d8b86a] to-[#8c8cff]",
    category: "Männer",
    href: "/competitions/champions-league",
    icon: Trophy,
    label: "Champions League",
    shortLabel: "UCL",
    slug: "champions-league",
  },
};

export const getCompetitionMeta = (league: LeagueKey): CompetitionMeta => {
  return COMPETITION_META[league] ?? {
    accentClass: "from-[#d8b86a] via-[#6eeaf2] to-[#43c886]",
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
  { href: "/today", label: "Heute" },
  { href: "/competitions/world-cup", label: "WM" },
  { href: "/competitions/bundesliga-1", label: "Bundesliga" },
  { href: "/competitions/bundesliga-2", label: "2. Bundesliga" },
  { href: "/competitions/women", label: "Frauen" },
  { href: "/competitions/men", label: "Männer" },
  { href: "/tables", label: "Tabellen" },
  { href: "/teams", label: "Teams" },
] as const;
