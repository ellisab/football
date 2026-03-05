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
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 10,
  },
  tableRowLeader: {
    backgroundColor: "#15261f",
    borderColor: "#2d553f",
  },
  tableRowEurope: {
    backgroundColor: "#151a22",
    borderColor: "#2a3441",
  },
  tableRowBottom: {
    backgroundColor: "#23171d",
    borderColor: "#46303a",
  },
  tablePosBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#1d2431",
    marginRight: 6,
  },
  tablePosLeader: {
    backgroundColor: theme.primary,
  },
  tablePosEurope: {
    backgroundColor: "#1f2835",
  },
  tablePosBottom: {
    backgroundColor: "#3a2530",
  },
  tablePosText: {
    color: "#98a4bb",
    fontSize: 12,
    fontWeight: "800" as const,
  },
  tablePosTextLeader: {
    color: "#ffffff",
  },
  tablePosTextEurope: {
    color: "#8aa0c0",
  },
  tablePosTextBottom: {
    color: "#f2bdcb",
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
    fontWeight: "700" as const,
  },
  tableMeta: {
    alignItems: "flex-end" as const,
    gap: 2,
  },
  tableZone: {
    color: theme.textSoft,
    fontSize: 10,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  tableCellPts: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: "800" as const,
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
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
});
