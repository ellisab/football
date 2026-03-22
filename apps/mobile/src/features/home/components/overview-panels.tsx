import { Pressable, Text, View } from "react-native";
import type { AppStyles } from "../../../app/theme/styles";

export function OverviewPanels({
  hasTable,
  onPrimaryPress,
  onSecondaryPress,
  styles,
}: {
  hasTable: boolean;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  styles: AppStyles;
}) {
  const actionCards = [
    {
      label: "Aktuell",
      title: "Neueste Ergebnisse",
      description: "Verfolge jeden Spielstand vom Anpfiff bis zum Abpfiff.",
      onPress: onPrimaryPress,
    },
    {
      label: hasTable ? "Tabelle" : "Überblick",
      title: hasTable ? "Tabellenlage" : "Spielüberblick",
      description: hasTable
        ? "Sieh direkt, wer um Europa und gegen den Abstieg spielt."
        : "Überblicke kommende Duelle und die Dynamik der Runde.",
      onPress: onSecondaryPress,
    },
  ];

  return (
    <View style={styles.header}>
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>Schnellzugriff</Text>
      </View>
      <View style={styles.quickActions}>
        {actionCards.map((action) => (
          <Pressable
            key={action.title}
            accessibilityRole="button"
            accessibilityState={{ disabled: !action.onPress }}
            disabled={!action.onPress}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.quickActionCard,
              pressed && action.onPress ? styles.quickActionCardPressed : null,
              !action.onPress ? styles.quickActionCardDisabled : null,
            ]}
          >
            <Text style={styles.quickActionLabel}>{action.label}</Text>
            <Text style={styles.quickActionTitle}>{action.title}</Text>
            <Text style={styles.quickActionDescription}>{action.description}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
