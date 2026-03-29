import { Image, Text, View } from "react-native";
import type { AppStyles } from "../../../app/theme/styles";

const mascotImage = require("../../../../assets/brand/maskot.png");

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
      <View style={styles.heroGlow} />
      <View style={styles.heroGrid}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroKicker}>Matchday HQ</Text>
          <Text style={styles.heroTitle}>Spieltag-Atlas</Text>
          <Text style={styles.heroDescription}>
            {leagueLabel} {season} mit Spieltag, Tabelle und dem neuen Maskottchen direkt
            auf dem Homescreen.
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

        <View style={styles.heroMascotWrap}>
          <View style={styles.heroMascotShadow} />
          <Image
            source={mascotImage}
            accessibilityLabel="Spieltag-Atlas Maskottchen im rot-schwarzen Trikot mit Fussball"
            resizeMode="contain"
            style={styles.heroMascot}
          />
        </View>
      </View>
    </View>
  );
}
