import type { AppTheme } from "../types";

export const createLayoutStyles = (theme: AppTheme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  backgroundLayer: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden" as const,
  },
  backgroundOrbOne: {
    position: "absolute" as const,
    top: -140,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: theme.primaryGlow,
  },
  backgroundOrbTwo: {
    position: "absolute" as const,
    top: -90,
    right: -140,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(17, 19, 24, 0.12)",
  },
  listContent: {
    paddingBottom: 44,
  },
  center: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    color: theme.textMuted,
  },
});
