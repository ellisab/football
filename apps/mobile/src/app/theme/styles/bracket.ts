import type { AppTheme } from "../types";

export const createBracketStyles = (theme: AppTheme) => ({
  bracketCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    paddingVertical: 10,
    shadowColor: "#10131b",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  roundTitle: {
    color: theme.textSoft,
    textTransform: "uppercase" as const,
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: "800" as const,
    marginBottom: 8,
    marginTop: 8,
  },
});
