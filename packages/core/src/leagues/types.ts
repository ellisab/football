export type LeagueKey =
  | "bl1"
  | "bl2"
  | "fbl1"
  | "dfb"
  | "cl";

export type LeagueGroupConfig = {
  key: LeagueKey;
  label: string;
  shortcutMatch: string[];
};

export type LeagueOption = {
  shortcut: LeagueKey;
  label: string;
  seasons: number[];
};
