import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, SafeAreaView, Text, View } from "react-native";
import { useState } from "react";
import { getCurrentSeasonYear, type LeagueKey } from "@footballleagues/core/leagues";
import { appStyles, appTheme } from "../../../app/theme";
import { BracketSection } from "../../champions-league/components/bracket-section";
import { useHomeData } from "../../matchday/hooks/use-home-data";
import { HomeSectionList } from "../components/home-section-list";
import { LeagueTabs } from "../components/league-tabs";
import { OverviewPanels } from "../components/overview-panels";

export function HomeScreen() {
  const [activeLeague, setActiveLeague] = useState<LeagueKey>("bl1");
  const theme = appTheme;
  const styles = appStyles;
  const season = getCurrentSeasonYear();
  const { data, loading, error } = useHomeData(activeLeague, season);

  const header = data ? (
    <View>
      <LeagueTabs
        activeLeague={activeLeague}
        onChange={setActiveLeague}
        styles={styles}
      />
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      <OverviewPanels hasTable={data.hasTable} styles={styles} />
    </View>
  ) : null;

  const footer =
    data?.resolvedLeague === "cl" && data.bracketMatches.length > 0 ? (
      <BracketSection rounds={data.bracketMatches} styles={styles} />
    ) : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <View style={styles.backgroundOrbOne} />
        <View style={styles.backgroundOrbTwo} />
      </View>
      {loading || !data ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      ) : (
        <HomeSectionList
          sections={data.sections}
          styles={styles}
          header={header}
          footer={footer}
        />
      )}
    </SafeAreaView>
  );
}
