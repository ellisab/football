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
    top: -96,
    left: -84,
    width: 264,
    height: 264,
    borderRadius: 132,
    backgroundColor: "rgba(255, 153, 83, 0.2)",
  },
  backgroundOrbTwo: {
    position: "absolute" as const,
    top: 104,
    right: -110,
    width: 248,
    height: 248,
    borderRadius: 124,
    backgroundColor: "rgba(87, 235, 255, 0.12)",
  },
  backgroundOrbThree: {
    position: "absolute" as const,
    bottom: 72,
    left: 44,
    width: 228,
    height: 228,
    borderRadius: 114,
    backgroundColor: "rgba(255, 92, 154, 0.11)",
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
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 15,
  },
});
