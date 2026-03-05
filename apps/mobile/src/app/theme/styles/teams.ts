import type { AppTheme } from "../types";

export const createTeamStyles = (theme: AppTheme) => ({
  teamLogoFrame: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: theme.logoBg,
    borderWidth: 1,
    borderColor: theme.logoBorder,
    overflow: "hidden" as const,
  },
  teamLogoFallback: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: theme.logoBg,
    borderWidth: 1,
    borderColor: theme.logoBorder,
  },
  teamLogoFallbackText: {
    color: theme.text,
    fontWeight: "700" as const,
  },
});
