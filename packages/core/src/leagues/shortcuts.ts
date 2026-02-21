import type { LeagueKey } from "./types";

export const getDataShortcutForLeague = (leagueKey: LeagueKey) => {
  return leagueKey === "cl" ? "ucl" : leagueKey;
};

export const getGroupShortcutForLeague = (leagueKey: LeagueKey) => {
  return leagueKey === "cl" ? "cl" : leagueKey;
};

export const resolveEffectiveLeagueShortcut = (
  leagueKey: LeagueKey,
  entryShortcut?: string
) => {
  if (leagueKey === "bl2") return "bl2";
  return entryShortcut ?? leagueKey;
};
