export type AppTheme = {
  direction: DesignDirection;
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

export type DesignDirection = "stadium" | "gazette";

const STADIUM_THEME: AppTheme = {
  direction: "stadium",
  background: "#0b0d12",
  surface: "#13161d",
  surfaceMuted: "#1b2030",
  surfaceSoft: "#111820",
  text: "#f7f9ff",
  textMuted: "#9ca6ba",
  textSoft: "#8d97ab",
  border: "#232937",
  borderSubtle: "#1d2330",
  primary: "#3dffa0",
  primarySoft: "#1a3a2a",
  primaryGlow: "rgba(61, 255, 160, 0.3)",
  heroBase: "#0c0e12",
  heroHighlight: "#111820",
  heroShade: "#0c1f17",
  heroTagBorder: "rgba(61, 255, 160, 0.5)",
  heroTagBg: "rgba(26, 58, 42, 0.55)",
  heroText: "#ffffff",
  heroTextMuted: "#9ca6ba",
  warningText: "#a9dfc3",
  warningBorder: "#2d553f",
  warningBg: "#13241d",
  emptyBg: "#131720",
  logoBg: "#1f2633",
  logoBorder: "#2b3345",
};

const GAZETTE_THEME: AppTheme = {
  direction: "gazette",
  background: "#f4eee5",
  surface: "#fffdf9",
  surfaceMuted: "#f1ebe1",
  surfaceSoft: "#f8f2e9",
  text: "#1a1612",
  textMuted: "#6b6257",
  textSoft: "#7c7266",
  border: "#e0d8cc",
  borderSubtle: "#e8dfd3",
  primary: "#8c6c2c",
  primarySoft: "#efe6d6",
  primaryGlow: "rgba(232, 184, 75, 0.28)",
  heroBase: "#1a1612",
  heroHighlight: "#201a14",
  heroShade: "#2f271e",
  heroTagBorder: "rgba(232, 184, 75, 0.5)",
  heroTagBg: "rgba(255, 255, 255, 0.07)",
  heroText: "#f5f1eb",
  heroTextMuted: "#d0c8bc",
  warningText: "#8c6c2c",
  warningBorder: "#dcc8a0",
  warningBg: "#fff5e4",
  emptyBg: "#f8f2e9",
  logoBg: "#f1ebe1",
  logoBorder: "#e3d9cb",
};

export const getTheme = (
  _scheme: "light" | "dark" | null | undefined,
  direction: DesignDirection
) => {
  return direction === "gazette" ? GAZETTE_THEME : STADIUM_THEME;
};
