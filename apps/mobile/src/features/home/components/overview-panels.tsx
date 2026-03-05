import { Text, View } from "react-native";
import type { AppStyles } from "../../../app/theme/styles";

export function OverviewPanels({
  leagueLabel,
  season,
  hasTable,
  heroKicker,
  matchdayNumber,
  stageLabel,
  styles,
}: {
  leagueLabel: string;
  season: number;
  hasTable: boolean;
  heroKicker: string;
  matchdayNumber: string | null;
  stageLabel: string;
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
      <View style={styles.heroPanel}>
        <View style={styles.heroPulseOne} />
        <View style={styles.heroPulseTwo} />
        <View style={styles.heroGrid}>
          <View style={styles.heroTagRow}>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagText}>
                {matchdayNumber ? "Live Matchday" : `Live ${stageLabel}`}
              </Text>
            </View>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagText}>{leagueLabel}</Text>
            </View>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagText}>Season {season}</Text>
            </View>
          </View>

          <Text style={styles.heroKicker}>{heroKicker}</Text>
          <Text style={styles.heroTitle}>
            Your <Text style={styles.heroTitleAccent}>matchday</Text> control room
          </Text>
          <Text style={styles.heroDescription}>
            Live fixtures, tables, and knockout drama in one pitch-side view.
          </Text>
        </View>
      </View>

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
