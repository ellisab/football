export type AppTheme = {
  background: string;
  card: string;
  cardMuted: string;
  text: string;
  textMuted: string;
  border: string;
  borderSubtle: string;
  accent: string;
  warningText: string;
  warningBorder: string;
  warningBg: string;
  emptyBg: string;
  logoBg: string;
  logoBorder: string;
};

const BASE_ACCENT = "#facc15";

export const THEMES: Record<"light" | "dark", AppTheme> = {
  light: {
    background: "#f8fafc",
    card: "#ffffff",
    cardMuted: "rgba(226, 232, 240, 0.7)",
    text: "#0f172a",
    textMuted: "#475569",
    border: "rgba(15, 23, 42, 0.12)",
    borderSubtle: "rgba(15, 23, 42, 0.08)",
    accent: BASE_ACCENT,
    warningText: "#92400e",
    warningBorder: "rgba(180, 83, 9, 0.35)",
    warningBg: "rgba(245, 158, 11, 0.2)",
    emptyBg: "rgba(226, 232, 240, 0.7)",
    logoBg: "rgba(15, 23, 42, 0.06)",
    logoBorder: "rgba(15, 23, 42, 0.12)",
  },
  dark: {
    background: "#0b1020",
    card: "#101827",
    cardMuted: "rgba(15, 23, 42, 0.5)",
    text: "#f8fafc",
    textMuted: "#cbd5f5",
    border: "rgba(148, 163, 184, 0.18)",
    borderSubtle: "rgba(148, 163, 184, 0.12)",
    accent: BASE_ACCENT,
    warningText: "#fde68a",
    warningBorder: "rgba(245, 158, 11, 0.4)",
    warningBg: "rgba(245, 158, 11, 0.15)",
    emptyBg: "rgba(15, 23, 42, 0.5)",
    logoBg: "rgba(255, 255, 255, 0.12)",
    logoBorder: "rgba(255, 255, 255, 0.15)",
  },
};

export const getTheme = (scheme: "light" | "dark" | null | undefined) => {
  return scheme === "dark" ? THEMES.dark : THEMES.light;
};
