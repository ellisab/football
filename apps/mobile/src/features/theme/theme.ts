export type AppTheme = {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceSoft: string;
  text: string;
  textMuted: string;
  textSoft: string;
  border: string;
  borderSubtle: string;
  primary: string;
  primarySoft: string;
  primaryGlow: string;
  heroBase: string;
  heroHighlight: string;
  heroShade: string;
  heroTagBorder: string;
  heroTagBg: string;
  heroText: string;
  heroTextMuted: string;
  warningText: string;
  warningBorder: string;
  warningBg: string;
  emptyBg: string;
  logoBg: string;
  logoBorder: string;
};

const PRIMARY_RED = "#d5001d";

export const THEMES: Record<"light" | "dark", AppTheme> = {
  light: {
    background: "#eceef2",
    surface: "#ffffff",
    surfaceMuted: "#f3f4f7",
    surfaceSoft: "#f8f9fc",
    text: "#111317",
    textMuted: "#4f525a",
    textSoft: "#646872",
    border: "#d8dbe3",
    borderSubtle: "#e3e5ec",
    primary: PRIMARY_RED,
    primarySoft: "#ffe4e8",
    primaryGlow: "rgba(213, 0, 29, 0.24)",
    heroBase: "#101217",
    heroHighlight: "#b8001a",
    heroShade: "#6d0010",
    heroTagBorder: "rgba(255, 255, 255, 0.52)",
    heroTagBg: "rgba(17, 19, 24, 0.28)",
    heroText: "#fffafb",
    heroTextMuted: "#ffd9df",
    warningText: "#7e5610",
    warningBorder: "#d9b468",
    warningBg: "#fff7dd",
    emptyBg: "#f2f3f7",
    logoBg: "#f1f2f6",
    logoBorder: "#d2d6df",
  },
  dark: {
    background: "#0f1219",
    surface: "#161a23",
    surfaceMuted: "#1f2430",
    surfaceSoft: "#1c212c",
    text: "#f8f9fc",
    textMuted: "#d4d8e2",
    textSoft: "#a5adbf",
    border: "#2c3343",
    borderSubtle: "#242b3a",
    primary: PRIMARY_RED,
    primarySoft: "#3b1a23",
    primaryGlow: "rgba(213, 0, 29, 0.34)",
    heroBase: "#11141c",
    heroHighlight: "#b3001a",
    heroShade: "#66000d",
    heroTagBorder: "rgba(255, 255, 255, 0.38)",
    heroTagBg: "rgba(255, 255, 255, 0.08)",
    heroText: "#fff8fa",
    heroTextMuted: "#f8c9d2",
    warningText: "#f3cb86",
    warningBorder: "#8a6937",
    warningBg: "#2f2718",
    emptyBg: "#222836",
    logoBg: "#242b3a",
    logoBorder: "#31384a",
  },
};

export const getTheme = (scheme: "light" | "dark" | null | undefined) => {
  return scheme === "dark" ? THEMES.dark : THEMES.light;
};
