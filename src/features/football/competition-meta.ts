import type { LeagueKey, LeagueOption } from "@footballleagues/core/leagues";
import { Flag, Goal, type LucideIcon, Shirt, Trophy } from "lucide-react";

export type CompetitionMeta = {
  category: "Männer" | "Global";
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
  region: string;
  shortLabel: string;
  slug: string;
};

const COMPETITION_META: Record<LeagueKey, CompetitionMeta> = {
  bl1: {
    category: "Männer",
    description: "Spieltag, Ergebnisse und Tabelle der Bundesliga.",
    href: "/competitions/bundesliga-1",
    icon: Goal,
    label: "Bundesliga",
    region: "Deutschland",
    shortLabel: "Bundesliga",
    slug: "bundesliga-1",
  },
  bl2: {
    category: "Männer",
    description: "Spieltag, Ergebnisse und Tabelle der 2. Bundesliga.",
    href: "/competitions/bundesliga-2",
    icon: Shirt,
    label: "2. Bundesliga",
    region: "Deutschland",
    shortLabel: "2. Bundesliga",
    slug: "bundesliga-2",
  },
  dfb: {
    category: "Männer",
    description: "Runden und Ergebnisse des deutschen Pokalwettbewerbs.",
    href: "/competitions/dfb-pokal",
    icon: Flag,
    label: "DFB-Pokal",
    region: "Deutschland",
    shortLabel: "DFB",
    slug: "dfb-pokal",
  },
  cl: {
    category: "Männer",
    description: "Spieltage, K.-o.-Runden und Tabelle der Champions League.",
    href: "/competitions/champions-league",
    icon: Trophy,
    label: "Champions League",
    region: "Europa",
    shortLabel: "UCL",
    slug: "champions-league",
  },
};

export const getCompetitionMeta = (league: LeagueKey): CompetitionMeta => {
  return COMPETITION_META[league];
};

export const getCompetitionCatalog = () => {
  return (Object.keys(COMPETITION_META) as LeagueKey[]).map((key) => ({
    key,
    ...COMPETITION_META[key],
  }));
};

export const getCompetitionHref = (
  option: Pick<LeagueOption, "seasons" | "shortcut">,
  season?: number,
) => {
  const resolvedSeason = season ?? option.seasons[0];
  const baseHref = getCompetitionMeta(option.shortcut).href;

  return resolvedSeason ? `${baseHref}?season=${resolvedSeason}` : baseHref;
};

export const getLeagueKeyFromSlug = (slug: string): LeagueKey | undefined => {
  return (Object.keys(COMPETITION_META) as LeagueKey[]).find(
    (key) => COMPETITION_META[key].slug === slug,
  );
};
