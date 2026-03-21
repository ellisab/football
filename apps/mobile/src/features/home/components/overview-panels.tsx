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
      label: "Aktuell",
      title: "Neueste Ergebnisse",
      description: "Verfolge jeden Spielstand vom Anpfiff bis zum Abpfiff.",
    },
    {
      label: hasTable ? "Tabelle" : "Überblick",
      title: hasTable ? "Tabellenlage" : "Spielüberblick",
      description: hasTable
        ? "Sieh direkt, wer um Europa und gegen den Abstieg spielt."
        : "Überblicke kommende Duelle und die Dynamik der Runde.",
    },
  ];

  return (
    <View style={styles.header}>
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>Schnellzugriff</Text>
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
