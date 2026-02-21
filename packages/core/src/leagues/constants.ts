import type { LeagueGroupConfig, LeagueKey } from "./types";

export const DEFAULT_LEAGUE: LeagueKey = "bl1";

export const LEAGUE_GROUPS: LeagueGroupConfig[] = [
  {
    key: "bl1",
    label: "Bundesliga",
    nameMatch: ["bundesliga"],
    shortcutMatch: ["bl1"],
  },
  {
    key: "bl2",
    label: "Zweite Bundesliga",
    nameMatch: [
      "2. bundesliga",
      "2. fussball-bundesliga",
      "2. fußball-bundesliga",
    ],
    shortcutMatch: ["bl2"],
  },
  {
    key: "fbl1",
    label: "Frauen-Bundesliga",
    nameMatch: [
      "1. frauen-bundesliga",
      "1. frauen bundesliga",
      "1. fussball-bundesliga damen",
      "1. fußball-bundesliga damen",
      "frauen fußball bundesliga",
      "frauen fussball bundesliga",
    ],
    shortcutMatch: ["fbl1", "bl1f", "dbl1", "frbu"],
  },
  {
    key: "fbl2",
    label: "2. Frauen-Bundesliga",
    nameMatch: ["2. frauen-bundesliga", "2. frauen bundesliga"],
    shortcutMatch: ["fbl2", "bl2f"],
  },
  {
    key: "dfb",
    label: "DFB-Pokal",
    nameMatch: ["dfb-pokal", "dfb pokal"],
    shortcutMatch: ["dfb"],
  },
  {
    key: "cl",
    label: "Champions League",
    nameMatch: ["champions league"],
    shortcutMatch: ["cl", "ucl"],
  },
];

export const MOBILE_LEAGUES: Array<{ key: LeagueKey; label: string }> =
  LEAGUE_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
  }));
