import type { LeagueGroupConfig, LeagueKey, LeagueTheme } from "./types";

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

export const LEAGUE_THEMES: Record<LeagueKey, LeagueTheme> = {
  bl1: {
    accent: "#facc15",
    accentSoft: "rgba(250, 204, 21, 0.15)",
    glow: "rgba(250, 204, 21, 0.25)",
  },
  bl2: {
    accent: "#38bdf8",
    accentSoft: "rgba(56, 189, 248, 0.15)",
    glow: "rgba(56, 189, 248, 0.25)",
  },
  pl: {
    accent: "#22c55e",
    accentSoft: "rgba(34, 197, 94, 0.15)",
    glow: "rgba(34, 197, 94, 0.25)",
  },
  cl: {
    accent: "#0ea5e9",
    accentSoft: "rgba(14, 165, 233, 0.15)",
    glow: "rgba(14, 165, 233, 0.25)",
  },
  el: {
    accent: "#fb923c",
    accentSoft: "rgba(251, 146, 60, 0.15)",
    glow: "rgba(251, 146, 60, 0.25)",
  },
  dfb: {
    accent: "#f97316",
    accentSoft: "rgba(249, 115, 22, 0.15)",
    glow: "rgba(249, 115, 22, 0.25)",
  },
};

export const DEFAULT_LEAGUE_THEME: LeagueTheme = {
  accent: "#e2e8f0",
  accentSoft: "rgba(226, 232, 240, 0.12)",
  glow: "rgba(226, 232, 240, 0.18)",
};

export const ALLOWED_IMAGE_HOSTS = new Set([
  "upload.wikimedia.org",
  "i.imgur.com",
  "www.bundesliga-reisefuehrer.de",
  "bundesliga-reisefuehrer.de",
  "www.bundesliga-logos.com",
  "bundesliga-logos.com",
  "www.bundesliga.com",
  "bundesliga.com",
  "www.bundesliga.de",
  "bundesliga.de",
]);

export const WIKIMEDIA_HOST = "upload.wikimedia.org";
export const DEFAULT_WIKIMEDIA_THUMB_SIZE = 120;
export const WIKIMEDIA_IMAGE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36",
};
