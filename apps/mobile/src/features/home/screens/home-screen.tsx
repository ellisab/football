import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, SafeAreaView, Text, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import { getCurrentSeasonYear, type LeagueKey } from "@footballleagues/core/leagues";
import { appStyles, appTheme } from "../../../app/theme";
import { BracketSection } from "../../champions-league/components/bracket-section";
import { useHomeData } from "../../matchday/hooks/use-home-data";
import {
  HomeSectionList,
  type HomeSectionListRef,
} from "../components/home-section-list";
import { LeagueTabs } from "../components/league-tabs";
import { OverviewPanels } from "../components/overview-panels";
import {
  getPrimaryQuickActionTarget,
  getSecondaryQuickActionTarget,
  type QuickActionTarget,
} from "../presenter/quick-action-targets";

export function HomeScreen() {
  const [activeLeague, setActiveLeague] = useState<LeagueKey>("bl1");
  const theme = appTheme;
  const styles = appStyles;
  const season = getCurrentSeasonYear();
  const { data, loading, error } = useHomeData(activeLeague, season);
  const listRef = useRef<HomeSectionListRef | null>(null);
  const pendingQuickActionTargetRef = useRef<QuickActionTarget | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (retryTimeoutRef.current) {
        globalThis.clearTimeout(retryTimeoutRef.current);
      }
    },
    []
  );

  const hasBracket = Boolean(data?.bracketMatches.length);
  const primaryQuickActionTarget = data
    ? getPrimaryQuickActionTarget({
        sections: data.sections,
        hasBracket,
      })
    : null;
  const secondaryQuickActionTarget = data
    ? getSecondaryQuickActionTarget({
        sections: data.sections,
        hasTable: data.hasTable,
        hasBracket,
      })
    : null;

  const scrollToQuickActionTarget = (target: QuickActionTarget | null) => {
    if (!target) {
      return;
    }

    pendingQuickActionTargetRef.current = target;

    if (retryTimeoutRef.current) {
      globalThis.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (target === "bracket") {
      listRef.current?.getScrollResponder()?.scrollToEnd({ animated: true });
      return;
    }

    if (!data) {
      return;
    }

    const sectionIndex = data.sections.findIndex((section) => section.key === target);

    if (sectionIndex < 0) {
      return;
    }

    listRef.current?.recordInteraction();
    listRef.current?.scrollToLocation({
      animated: true,
      sectionIndex,
      itemIndex: 0,
      viewOffset: 12,
    });
  };

  const handleScrollToIndexFailed = ({
    index,
    averageItemLength,
  }: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    listRef.current?.getScrollResponder()?.scrollTo({
      animated: true,
      y: Math.max(0, averageItemLength * index),
    });

    retryTimeoutRef.current = globalThis.setTimeout(() => {
      scrollToQuickActionTarget(pendingQuickActionTargetRef.current);
    }, 80);
  };

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
      <OverviewPanels
        hasTable={data.hasTable}
        onPrimaryPress={() => scrollToQuickActionTarget(primaryQuickActionTarget)}
        onSecondaryPress={() => scrollToQuickActionTarget(secondaryQuickActionTarget)}
        styles={styles}
      />
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
          <Text style={styles.loadingText}>Spiele werden geladen...</Text>
        </View>
      ) : (
        <HomeSectionList
          sections={data.sections}
          styles={styles}
          header={header}
          footer={footer}
          listRef={listRef}
          onScrollToIndexFailed={handleScrollToIndexFailed}
        />
      )}
    </SafeAreaView>
  );
}
