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
        <View style={styles.sectionKickerRow}>
          <View style={styles.sectionKickerDot} />
          <Text style={styles.sectionKicker}>Wettbewerbe</Text>
        </View>
      </View>
      <View style={styles.tabs}>
        {options.map((option) => {
          const isActive = option.shortcut === activeLeague;

          return (
            <Pressable
              key={option.shortcut}
              onPress={() => onChange(option)}
              style={({ pressed }) => [pressed && styles.tabPressed]}
            >
              <View style={[styles.tab, isActive && styles.tabActive]}>
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {getLeagueLabel(option.shortcut)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
