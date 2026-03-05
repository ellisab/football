import { Pressable, Text, View } from "react-native";
import { MOBILE_LEAGUES, type LeagueKey } from "@footballleagues/core/leagues";
import type { AppStyles } from "../../../app/theme/styles";

export function LeagueTabs({
  activeLeague,
  onChange,
  styles,
}: {
  activeLeague: LeagueKey;
  onChange: (league: LeagueKey) => void;
  styles: AppStyles;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>Categories</Text>
      </View>
      <View style={styles.tabs}>
        {MOBILE_LEAGUES.map((league) => {
          const isActive = league.key === activeLeague;

          return (
            <Pressable
              key={league.key}
              onPress={() => onChange(league.key)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {league.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
