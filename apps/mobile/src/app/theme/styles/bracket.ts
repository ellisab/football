import type { AppTheme } from "../types";

export const createBracketStyles = (theme: AppTheme) => ({
  bracketCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    paddingVertical: 10,
    overflow: "hidden" as const,
    shadowColor: "#07030d",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  roundTitle: {
    color: theme.accent,
    textTransform: "uppercase" as const,
    letterSpacing: 2.6,
    fontSize: 11,
    fontFamily: theme.fonts.bodyBold,
    marginBottom: 8,
    marginTop: 8,
  },
});
