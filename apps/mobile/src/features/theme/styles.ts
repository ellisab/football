import { StyleSheet } from "react-native";
import type { AppTheme } from "./theme";

export const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    title: {
      color: theme.text,
      fontSize: 28,
      fontWeight: "700",
      letterSpacing: 2,
      textTransform: "uppercase",
    },
    subtitle: {
      color: theme.textMuted,
      marginTop: 6,
      fontSize: 14,
    },
    tabs: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 16,
    },
    tab: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
    },
    tabText: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "600",
    },
    listContent: {
      paddingBottom: 36,
    },
    section: {
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 4,
    },
    sectionSubtitle: {
      color: theme.textMuted,
      marginBottom: 12,
    },
    roundTitle: {
      color: theme.textMuted,
      textTransform: "uppercase",
      letterSpacing: 2,
      fontSize: 12,
      marginBottom: 6,
      marginTop: 8,
    },
    card: {
      marginHorizontal: 20,
      marginVertical: 8,
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    teamRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
      minWidth: 0,
    },
    kickoff: {
      color: theme.textMuted,
      fontSize: 12,
    },
    status: {
      color: theme.textMuted,
      fontSize: 12,
    },
    team: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
    },
    score: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "700",
    },
    teamLogoFrame: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.logoBg,
      borderWidth: 1,
      borderColor: theme.logoBorder,
      overflow: "hidden",
    },
    teamLogoFallback: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.logoBg,
      borderWidth: 1,
      borderColor: theme.logoBorder,
    },
    teamLogoFallbackText: {
      color: theme.text,
      fontWeight: "700",
    },
    goalList: {
      marginTop: 10,
      alignItems: "center",
    },
    goalItem: {
      color: theme.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    loadingText: {
      marginTop: 12,
      color: theme.textMuted,
    },
    emptyState: {
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.emptyBg,
    },
    emptyText: {
      color: theme.textMuted,
      textAlign: "center",
    },
    errorBanner: {
      marginHorizontal: 20,
      marginTop: 8,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.warningBorder,
      backgroundColor: theme.warningBg,
    },
    errorText: {
      color: theme.warningText,
      fontSize: 12,
    },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginHorizontal: 20,
      backgroundColor: theme.card,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.border,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderSubtle,
    },
    tableRowFirst: {
      borderTopWidth: 1,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
    },
    tableRowLast: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      borderBottomLeftRadius: 14,
      borderBottomRightRadius: 14,
      marginBottom: 8,
    },
    tableCellPos: {
      width: 24,
      color: theme.textMuted,
      fontSize: 12,
    },
    tableCellTeam: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flex: 1,
      minWidth: 0,
      marginRight: 8,
    },
    tableCellTeamText: {
      flexShrink: 1,
      color: theme.text,
      fontSize: 13,
      fontWeight: "600",
    },
    tableCellStat: {
      width: 28,
      textAlign: "center",
      color: theme.textMuted,
      fontSize: 12,
    },
    tableCellPts: {
      width: 32,
      textAlign: "right",
      color: theme.text,
      fontSize: 13,
      fontWeight: "700",
    },
  });

export type AppStyles = ReturnType<typeof createStyles>;
