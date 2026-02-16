import type { ApiLeague } from "../openligadb/index";

export const getCurrentSeasonYear = (now: Date = new Date()) => {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 7 ? year : year - 1;
};

export const parseSeasonValue = (raw: number | string | undefined) => {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const resolveSeasonsFromLeagues = (entries: ApiLeague[]) => {
  const seasons = entries
    .map((league) => parseSeasonValue(league.leagueSeason))
    .filter((season) => season > 0)
    .sort((a, b) => b - a);

  return Array.from(new Set(seasons));
};

export const formatSeasonRange = (season: number | undefined) => {
  if (!season || season <= 0) return "";
  return `${season}/${season + 1}`;
};
