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
    key: "fbl1",
    label: "Frauen-Bundesliga",
    shortcutMatch: ["fbl1", "ffb1", "bl1f", "dbl1", "frbu"],
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
];

export const isLeagueKey = (value: string): value is LeagueKey => {
  return LEAGUE_GROUPS.some((group) => group.key === value);
};
