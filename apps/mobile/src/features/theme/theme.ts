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

const STADIUM_THEME: AppTheme = {
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

export const getTheme = (_scheme: "light" | "dark" | null | undefined) => {
  return STADIUM_THEME;
};
