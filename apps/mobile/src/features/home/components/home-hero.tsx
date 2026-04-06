import { Text, View } from "react-native";
import type { AppStyles } from "../../../app/theme/styles";

export function HomeHero({
  leagueLabel,
  season,
  styles,
}: {
  leagueLabel: string;
  season: number;
  styles: AppStyles;
}) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroGradient}>
        <View style={styles.heroGlowWarm} />
        <View style={styles.heroGlowCool} />
        <View style={styles.heroGlowPink} />
        <View style={styles.heroGrid}>
          <View style={styles.heroKickerRow}>
            <View style={styles.heroKickerDot} />
            <Text style={styles.heroKicker}>Spieltag</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Spieltag</Text>
            <Text style={styles.heroDescription}>
              {leagueLabel} {season} mit Spieltag, Tabelle und Poster-Look direkt auf
              dem Homescreen.
            </Text>
            <View style={styles.heroBadges}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{leagueLabel}</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>Saison {season}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
