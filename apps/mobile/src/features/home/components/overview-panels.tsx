import { Text, View } from "react-native";
import type { AppStyles } from "../../../app/theme/styles";

export function OverviewPanels({
  hasTable,
  styles,
}: {
  hasTable: boolean;
  styles: AppStyles;
}) {
  const actionCards = [
    {
      label: "Latest",
      title: "Latest Results",
      description: "Track every scoreline from first whistle to final.",
    },
    {
      label: hasTable ? "Standings" : "Insights",
      title: hasTable ? "Table Shift" : "Match Insights",
      description: hasTable
        ? "Jump straight to qualification and relegation pressure."
        : "Scan upcoming ties and in-round momentum.",
    },
  ];

  return (
    <View style={styles.header}>
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>Quick Actions</Text>
      </View>
      <View style={styles.quickActions}>
        {actionCards.map((action) => (
          <View key={action.title} style={styles.quickActionCard}>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
            <Text style={styles.quickActionTitle}>{action.title}</Text>
            <Text style={styles.quickActionDescription}>{action.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
