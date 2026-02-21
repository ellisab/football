import {
  DEFAULT_LEAGUE_THEME,
  LEAGUE_THEMES,
} from "./constants";
import type { LeagueTheme } from "./types";
import type { LeagueKey } from "../leagues";

export const resolveLeagueTheme = (leagueKey: string): LeagueTheme => {
  return LEAGUE_THEMES[leagueKey as LeagueKey] ?? DEFAULT_LEAGUE_THEME;
};
