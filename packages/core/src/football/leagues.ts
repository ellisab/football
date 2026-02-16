import type { ApiLeague } from "../openligadb/index";
import {
  DEFAULT_LEAGUE,
  LEAGUE_GROUPS,
} from "./constants";
import {
  formatSeasonRange,
  getCurrentSeasonYear,
  parseSeasonValue,
  resolveSeasonsFromLeagues,
} from "./season";
import type { LeagueKey, LeagueOption } from "./types";

export const normalizeText = (value?: string) => (value ?? "").toLowerCase();

export const isLeagueKey = (value: string): value is LeagueKey => {
  return LEAGUE_GROUPS.some((group) => group.key === value);
};

export const isFootballLeague = (league: ApiLeague) => {
  const sportName = normalizeText(league.sport?.sportName);
  return (
    sportName.includes("fußball") ||
    sportName.includes("fussball") ||
    sportName.includes("football")
  );
};

export const matchesLeagueGroup = (league: ApiLeague, groupKey: LeagueKey) => {
  const group = LEAGUE_GROUPS.find((entry) => entry.key === groupKey);
  if (!group) return false;

  const leagueName = normalizeText(league.leagueName);
  const leagueShortcut = normalizeText(league.leagueShortcut);

  const nameHit = group.nameMatch.some((needle) => leagueName.includes(needle));
  const shortcutHit = group.shortcutMatch.some((needle) =>
    leagueShortcut.startsWith(needle)
  );

  return nameHit || shortcutHit;
};

export const buildLeagueEntriesByGroup = (leagues: ApiLeague[]) => {
  const map = new Map<LeagueKey, ApiLeague[]>();

  for (const group of LEAGUE_GROUPS) {
    map.set(group.key, []);
  }

  for (const league of leagues) {
    if (!league.leagueShortcut || !league.leagueSeason || !isFootballLeague(league)) {
      continue;
    }

    for (const group of LEAGUE_GROUPS) {
      if (matchesLeagueGroup(league, group.key)) {
        map.get(group.key)?.push(league);
        break;
      }
    }
  }

  return map;
};

export const keepLatestSeasonOnly = (entries: ApiLeague[]) => {
  const seasons = resolveSeasonsFromLeagues(entries);
  if (seasons.length === 0) return entries;

  const latest = seasons[0];
  return entries.filter((entry) => parseSeasonValue(entry.leagueSeason) === latest);
};

export const pickLeagueEntryForSeason = (entries: ApiLeague[], season: number) => {
  const candidates = entries.filter(
    (entry) => parseSeasonValue(entry.leagueSeason) === season
  );
  if (candidates.length === 0) return undefined;

  return candidates.sort((a, b) => {
    const aShortcut = a.leagueShortcut ?? "";
    const bShortcut = b.leagueShortcut ?? "";
    return aShortcut.length - bShortcut.length || aShortcut.localeCompare(bShortcut);
  })[0];
};

export const getAvailableGroupKeys = (
  groupedLeagues: Map<LeagueKey, ApiLeague[]>
): LeagueKey[] => {
  return LEAGUE_GROUPS.map((group) => group.key).filter(
    (key) => (groupedLeagues.get(key)?.length ?? 0) > 0
  );
};

export const resolveLeagueSelection = (
  requestedLeague: string | undefined,
  availableGroupKeys: LeagueKey[]
): LeagueKey => {
  const fallbackLeague = availableGroupKeys[0] ?? DEFAULT_LEAGUE;
  if (!requestedLeague) return fallbackLeague;
  if (!isLeagueKey(requestedLeague)) return fallbackLeague;
  return availableGroupKeys.includes(requestedLeague)
    ? requestedLeague
    : fallbackLeague;
};

export const resolveSeasonSelection = ({
  requestedSeason,
  entries,
  fallbackYear,
}: {
  requestedSeason?: string;
  entries: ApiLeague[];
  fallbackYear?: number;
}) => {
  const parsedRequested = requestedSeason
    ? Number.parseInt(requestedSeason, 10)
    : Number.NaN;
  const seasonOptions = resolveSeasonsFromLeagues(entries);

  if (
    !Number.isNaN(parsedRequested) &&
    seasonOptions.includes(parsedRequested)
  ) {
    return parsedRequested;
  }

  return seasonOptions[0] ?? fallbackYear ?? getCurrentSeasonYear();
};

export const buildLeagueOptions = ({
  availableGroupKeys,
  groupedLeagues,
  seasonOverrides,
}: {
  availableGroupKeys: LeagueKey[];
  groupedLeagues: Map<LeagueKey, ApiLeague[]>;
  seasonOverrides?: Partial<Record<LeagueKey, number>>;
}): LeagueOption[] => {
  return availableGroupKeys.map((key) => {
    const groupConfig = LEAGUE_GROUPS.find((group) => group.key === key);
    const entries = groupedLeagues.get(key) ?? [];
    const seasons =
      seasonOverrides?.[key] !== undefined
        ? [seasonOverrides[key] as number]
        : resolveSeasonsFromLeagues(entries);
    const latestSeason = seasons[0];
    const latestEntry =
      latestSeason !== undefined
        ? pickLeagueEntryForSeason(entries, latestSeason)
        : undefined;
    const baseLabel = groupConfig?.label ?? latestEntry?.leagueName ?? key.toUpperCase();
    const seasonLabel = formatSeasonRange(latestSeason);

    return {
      shortcut: key,
      label: seasonLabel ? `${baseLabel} ${seasonLabel}` : baseLabel,
      seasons,
    };
  });
};
