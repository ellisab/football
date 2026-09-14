import type { LeagueKey } from "./types";

export const getDataShortcutForLeague = (
  leagueKey: LeagueKey,
  season?: number,
) => {
  if (leagueKey === "uel" && season !== undefined) return `uel${season}`;
  return leagueKey === "cl" ? "ucl" : leagueKey;
};

export const resolveEffectiveLeagueShortcut = (
  leagueKey: LeagueKey,
  entryShortcut?: string,
) => {
  if (leagueKey === "bl2") return "bl2";
  return entryShortcut ?? leagueKey;
};
