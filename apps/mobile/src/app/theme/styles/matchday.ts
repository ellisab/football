import type { AppTheme } from "../types";

export const createMatchdayStyles = (theme: AppTheme) => ({
  card: {
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 16,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: "#0f1015",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardMetaRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 10,
    gap: 8,
    flexWrap: "wrap" as const,
  },
  cardMetaChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    backgroundColor: theme.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cardMetaText: {
    color: theme.textSoft,
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  cardMetaStatusFinal: {
    backgroundColor: theme.primarySoft,
    borderColor: theme.primary,
  },
  cardMetaStatusScheduled: {
    backgroundColor: theme.surfaceSoft,
  },
  cardMetaStatusFinalText: {
    color: theme.primary,
  },
  cardMetaStatusScheduledText: {
    color: theme.textSoft,
  },
  teamRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    flex: 1,
    minWidth: 0,
    justifyContent: "space-between" as const,
  },
  teamLabelRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  teamLabelRowSecondary: {
    marginTop: 10,
  },
  team: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  score: {
    color: theme.primary,
    fontSize: 22,
    fontWeight: "800" as const,
    letterSpacing: 0.8,
  },
  goalList: {
    marginTop: 12,
    gap: 4,
  },
  goalItem: {
    color: theme.textSoft,
    fontSize: 12,
  },
});
