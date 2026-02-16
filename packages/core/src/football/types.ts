export type LeagueKey = "bl1" | "bl2" | "dfb" | "cl" | "pl" | "el";

export type LeagueGroupConfig = {
  key: LeagueKey;
  label: string;
  nameMatch: string[];
  shortcutMatch: string[];
};

export type LeagueTheme = {
  accent: string;
  accentSoft: string;
  glow: string;
};

export type LeagueOption = {
  shortcut: LeagueKey;
  label: string;
  seasons: number[];
};
