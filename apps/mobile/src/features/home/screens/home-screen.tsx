import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, SafeAreaView, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { getCurrentSeasonYear, type LeagueKey } from "@footballleagues/core/leagues";
import { appStyles, appTheme } from "../../../app/theme";
import { BracketSection } from "../../champions-league/components/bracket-section";
import { useHomeData } from "../hooks/use-home-data";
import { HomeSectionList } from "../components/home-section-list";
import { HomeHero } from "../components/home-hero";
import { LeagueTabs } from "../components/league-tabs";

export function HomeScreen() {
  const initialSeason = getCurrentSeasonYear();
  const [selection, setSelection] = useState<{
    league: LeagueKey;
    season: number;
  }>({
    league: "bl1",
    season: initialSeason,
  });
  const theme = appTheme;
  const styles = appStyles;
  const { data, loading, error } = useHomeData(selection.league, selection.season);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (
      data.resolvedLeague === selection.league &&
      data.resolvedSeason === selection.season
    ) {
      return;
    }

    setSelection({
      league: data.resolvedLeague,
      season: data.resolvedSeason,
    });
  }, [data, selection.league, selection.season]);

  const header = data ? (
    <View>
      <HomeHero
        leagueLabel={data.leagueLabel}
        season={data.resolvedSeason}
        styles={styles}
      />
      <LeagueTabs
        options={data.leagueOptions}
        activeLeague={data.resolvedLeague}
        onChange={(option) =>
          setSelection({
            league: option.shortcut,
            season: option.seasons[0] ?? data.resolvedSeason,
          })
        }
        styles={styles}
      />
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  ) : null;

  const footer =
    data && data.bracketMatches.length > 0 ? (
      <BracketSection
        rounds={data.bracketMatches}
        title={`${data.leagueLabel} Baum`}
        styles={styles}
      />
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
          <Text style={styles.loadingText}>Spiele werden geladen...</Text>
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
