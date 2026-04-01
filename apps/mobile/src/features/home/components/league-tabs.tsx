import { Pressable, Text, View } from "react-native";
import { getLeagueLabel, type LeagueKey, type LeagueOption } from "@footballleagues/core/leagues";
import type { AppStyles } from "../../../app/theme/styles";

export function LeagueTabs({
  options,
  activeLeague,
  onChange,
  styles,
}: {
  options: LeagueOption[];
  activeLeague: LeagueKey;
  onChange: (option: LeagueOption) => void;
  styles: AppStyles;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>Wettbewerbe</Text>
      </View>
      <View style={styles.tabs}>
        {options.map((option) => {
          const isActive = option.shortcut === activeLeague;

          return (
            <Pressable
              key={option.shortcut}
              onPress={() => onChange(option)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {getLeagueLabel(option.shortcut)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
