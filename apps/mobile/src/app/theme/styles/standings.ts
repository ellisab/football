import type { AppTheme } from "../types";

export const createStandingsStyles = (theme: AppTheme) => ({
  tableRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 22,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 10,
    overflow: "hidden" as const,
  },
  tableRowLeader: {
    borderColor: "rgba(255, 214, 108, 0.35)",
  },
  tableRowEurope: {
    borderColor: "rgba(87, 235, 255, 0.25)",
  },
  tableRowBottom: {
    borderColor: "rgba(255, 124, 167, 0.28)",
  },
  tablePosBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginRight: 6,
  },
  tablePosLeader: {
    backgroundColor: theme.primary,
  },
  tablePosEurope: {
    backgroundColor: "rgba(87, 235, 255, 0.18)",
  },
  tablePosBottom: {
    backgroundColor: "rgba(255, 92, 154, 0.18)",
  },
  tablePosText: {
    color: theme.textSoft,
    fontSize: 12,
    fontFamily: theme.fonts.bodyBold,
  },
  tablePosTextLeader: {
    color: "#1b0915",
  },
  tablePosTextEurope: {
    color: "#dffcff",
  },
  tablePosTextBottom: {
    color: "#ffe1ee",
  },
  tableMain: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  tableCellTeam: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
  tableCellTeamText: {
    flexShrink: 1,
    color: theme.text,
    fontSize: 14,
    fontFamily: theme.fonts.bodyBold,
  },
  tableMeta: {
    alignItems: "flex-end" as const,
    gap: 2,
  },
  tableZone: {
    color: theme.textSoft,
    fontSize: 10,
    fontFamily: theme.fonts.bodyBold,
    textTransform: "uppercase" as const,
    letterSpacing: 1.2,
  },
  tableCellPts: {
    color: theme.primary,
    fontSize: 16,
    fontFamily: theme.fonts.bodyBold,
  },
  tableStatsRow: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    flexDirection: "row" as const,
    justifyContent: "flex-end" as const,
    gap: 10,
  },
  tableStat: {
    color: theme.textSoft,
    fontSize: 11,
    fontFamily: theme.fonts.bodySemibold,
    letterSpacing: 0.2,
  },
});
