import type { LeagueGroupConfig, LeagueKey } from "./types";

export const DEFAULT_LEAGUE: LeagueKey = "bl1";

export const LEAGUE_GROUPS: LeagueGroupConfig[] = [
  {
    key: "bl1",
    label: "Bundesliga",
    shortcutMatch: ["bl1", "bl1/arena"],
  },
  {
    key: "bl2",
    label: "Zweite Bundesliga",
    shortcutMatch: ["bl2"],
  },
  {
    key: "dfb",
    label: "DFB-Pokal",
    shortcutMatch: ["dfb"],
  },
  {
    key: "cl",
    label: "Champions League",
    shortcutMatch: ["cl", "ucl"],
  },
  {
    key: "uel",
    label: "Europa League",
    // The 2025 `uel` feed contains only knockout games, not a league table.
    shortcutMatch: ["uel2026"],
  },
  {
    key: "nla",
    label: "Nations League A",
    shortcutMatch: ["nla"],
  },
];

export const isLeagueKey = (value: string): value is LeagueKey => {
  return LEAGUE_GROUPS.some((group) => group.key === value);
};
