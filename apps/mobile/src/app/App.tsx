import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  SectionList,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SvgUri } from "react-native-svg";
import {
  formatKickoff,
  getCurrentSeasonYear,
  getFinalResult,
  getImageRequestHeaders,
  isAllowedImageHost,
  isSvgUrl,
  normalizeIconUrl,
  resolveLeagueTheme,
  type ApiMatch,
  type ApiTableRow,
  type LeagueKey,
} from "@footballleagues/core";
import { MOBILE_LEAGUES } from "../features/leagues/constants";
import { useHomeData } from "../features/matchday/hooks/use-home-data";
import { createStyles } from "../features/theme/styles";
import { getTheme } from "../features/theme/theme";

type SectionItem = ApiMatch | ApiTableRow;

type AppSection = {
  key: string;
  title: string;
  subtitle: string;
  type: "match" | "table";
  emptyText: string;
  data: SectionItem[];
};

export default function App() {
  const [activeLeague, setActiveLeague] = useState<LeagueKey>("bl1");
  const [failedIconUrls, setFailedIconUrls] = useState<Record<string, boolean>>({});

  const colorScheme = useColorScheme();
  const theme = useMemo(() => getTheme(colorScheme), [colorScheme]);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const statusBarStyle = colorScheme === "dark" ? "light" : "dark";

  const season = useMemo(() => getCurrentSeasonYear(), []);
  const leagueTheme = resolveLeagueTheme(activeLeague);

  const {
    groupName,
    matches,
    nextGroupName,
    nextMatches,
    table,
    bracketMatches,
    loading,
    error,
  } = useHomeData(activeLeague, season);

  const dynamicStyles = useMemo(
    () => ({
      tabActive: {
        borderColor: leagueTheme.accent,
        backgroundColor: leagueTheme.accentSoft,
      },
      tabIdle: {
        borderColor: theme.border,
        backgroundColor: theme.cardMuted,
      },
      tabTextActive: { color: leagueTheme.accent, fontWeight: "700" as const },
    }),
    [leagueTheme, theme]
  );

  const markIconLoadFailed = useCallback((iconUrl: string | undefined) => {
    if (!iconUrl) return;

    setFailedIconUrls((prev) => {
      if (prev[iconUrl]) return prev;
      return { ...prev, [iconUrl]: true };
    });
  }, []);

  useEffect(() => {
    setFailedIconUrls({});
  }, [activeLeague, season]);

  const renderTeamBadge = (name?: string, iconUrl?: string, size = 26) => {
    const normalizedUrl = normalizeIconUrl(iconUrl, {
      convertWikimediaSvgToPng: true,
    });
    const sizeStyle = { width: size, height: size, borderRadius: size / 2 };
    const innerSize = Math.max(12, Math.round(size * 0.7));
    const textSize = Math.max(10, Math.round(size * 0.45));
    const requestHeaders = getImageRequestHeaders(normalizedUrl);

    if (
      normalizedUrl &&
      isAllowedImageHost(normalizedUrl) &&
      !failedIconUrls[normalizedUrl]
    ) {
      const isSvg = isSvgUrl(normalizedUrl);

      return (
        <View style={[styles.teamLogoFrame, sizeStyle]}>
          {isSvg ? (
            <SvgUri
              uri={normalizedUrl}
              width={innerSize}
              height={innerSize}
              onError={() => markIconLoadFailed(normalizedUrl)}
            />
          ) : (
            <Image
              source={
                requestHeaders
                  ? { uri: normalizedUrl, headers: requestHeaders }
                  : { uri: normalizedUrl }
              }
              accessibilityLabel={name ?? "Team crest"}
              resizeMode="contain"
              style={{ width: innerSize, height: innerSize }}
              onError={() => markIconLoadFailed(normalizedUrl)}
            />
          )}
        </View>
      );
    }

    return (
      <View style={[styles.teamLogoFallback, sizeStyle]}>
        <Text style={[styles.teamLogoFallbackText, { fontSize: textSize }]}>
          {(name ?? "T").slice(0, 1)}
        </Text>
      </View>
    );
  };

  const sections = useMemo<AppSection[]>(() => {
    const result: AppSection[] = [
      {
        key: "matchday",
        title: groupName,
        subtitle: `Season ${season}`,
        type: "match",
        emptyText: error || "No match results available yet for this matchday.",
        data: matches,
      },
    ];

    if (nextMatches.length > 0) {
      result.push({
        key: "next-matchday",
        title: nextGroupName || "Next Matchday",
        subtitle: `Season ${season} · upcoming fixtures`,
        type: "match",
        emptyText: "No upcoming fixtures available yet.",
        data: nextMatches,
      });
    }

    if (activeLeague !== "dfb") {
      result.push({
        key: "table",
        title: "Table",
        subtitle: "Updated standings for the selected season.",
        type: "table",
        emptyText: error || "Table data is not available yet.",
        data: table,
      });
    }

    return result;
  }, [activeLeague, error, groupName, matches, nextGroupName, nextMatches, season, table]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Matchday Atlas</Text>
      <Text style={styles.subtitle}>
        Follow the latest matchday results and tables for your favorite leagues.
      </Text>
      <View style={styles.tabs}>
        {MOBILE_LEAGUES.map((league) => {
          const isActive = league.key === activeLeague;

          return (
            <Pressable
              key={league.key}
              onPress={() => setActiveLeague(league.key)}
              style={[styles.tab, isActive ? dynamicStyles.tabActive : dynamicStyles.tabIdle]}
            >
              <Text style={[styles.tabText, isActive && dynamicStyles.tabTextActive]}>
                {league.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderMatchCard = (item: ApiMatch) => {
    const finalResult = getFinalResult(item);
    const score = finalResult
      ? `${finalResult?.pointsTeam1 ?? 0} - ${finalResult?.pointsTeam2 ?? 0}`
      : "-";

    return (
      <View
        key={item?.matchID ?? `${item?.team1?.teamId}-${item?.team2?.teamId}`}
        style={styles.card}
      >
        <View style={styles.cardRow}>
          <Text style={styles.kickoff}>
            {formatKickoff(item?.matchDateTimeUTC || item?.matchDateTime)}
          </Text>
          <Text style={styles.status}>{item?.matchIsFinished ? "Final" : "Scheduled"}</Text>
        </View>
        <View style={styles.cardRow}>
          <View style={styles.teamRow}>
            {renderTeamBadge(item?.team1?.teamName, item?.team1?.teamIconUrl)}
            <Text style={styles.team} numberOfLines={1}>
              {item?.team1?.teamName || "Home"}
            </Text>
          </View>
          <Text style={styles.score}>{score}</Text>
        </View>
        <View style={styles.teamRow}>
          {renderTeamBadge(item?.team2?.teamName, item?.team2?.teamIconUrl)}
          <Text style={styles.team} numberOfLines={1}>
            {item?.team2?.teamName || "Away"}
          </Text>
        </View>
        {Array.isArray(item?.goals) && item.goals.length > 0 ? (
          <View style={styles.goalList}>
            {item.goals.map((goal, index) => (
              <Text
                key={goal?.goalID ?? `${goal?.goalGetterName}-${goal?.matchMinute}-${index}`}
                style={styles.goalItem}
              >
                {goal?.matchMinute ?? "-"}' {goal?.goalGetterName ?? "Goal"}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  const renderTableRow = (row: ApiTableRow, index: number, total: number) => {
    const isFirst = index === 0;
    const isLast = index === total - 1;

    return (
      <View
        style={[
          styles.tableRow,
          isFirst && styles.tableRowFirst,
          isLast && styles.tableRowLast,
        ]}
      >
        <Text style={styles.tableCellPos}>{index + 1}</Text>
        <View style={styles.tableCellTeam}>
          {renderTeamBadge(row?.teamName, row?.teamIconUrl, 20)}
          <Text style={styles.tableCellTeamText} numberOfLines={1}>
            {row?.teamName ?? "Team"}
          </Text>
        </View>
        <Text style={styles.tableCellStat}>{row?.matches ?? 0}</Text>
        <Text style={styles.tableCellStat}>{row?.won ?? 0}</Text>
        <Text style={styles.tableCellStat}>{row?.draw ?? 0}</Text>
        <Text style={styles.tableCellStat}>{row?.lost ?? 0}</Text>
        <Text style={styles.tableCellStat}>{row?.goalDiff ?? 0}</Text>
        <Text style={styles.tableCellPts}>{row?.points ?? 0}</Text>
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: AppSection }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
      {section.data.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{section.emptyText}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderSectionItem = ({
    item,
    index,
    section,
  }: {
    item: SectionItem;
    index: number;
    section: AppSection;
  }) => {
    if (section.type === "match") {
      return renderMatchCard(item as ApiMatch);
    }

    if (section.type === "table") {
      return renderTableRow(item as ApiTableRow, index, section.data.length);
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={statusBarStyle} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={leagueTheme.accent} />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      ) : (
        <SectionList<SectionItem, AppSection>
          sections={sections}
          keyExtractor={(item, index) =>
            (item as ApiMatch)?.matchID?.toString?.() ||
            (item as ApiTableRow)?.teamInfoId?.toString?.() ||
            (item as ApiTableRow)?.teamName ||
            index.toString()
          }
          renderItem={renderSectionItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              {renderHeader()}
              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              {activeLeague === "cl" && bracketMatches.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Champions League Bracket</Text>
                  <Text style={styles.sectionSubtitle}>
                    Knockout rounds based on the latest groups data.
                  </Text>
                  {bracketMatches.map((round) => (
                    <View key={round?.group?.groupID ?? round?.group?.groupName}>
                      <Text style={styles.roundTitle}>{round?.group?.groupName ?? "Round"}</Text>
                      {round.matches.length === 0 ? (
                        <View style={styles.card}>
                          <Text style={styles.emptyText}>No matches available yet.</Text>
                        </View>
                      ) : (
                        round.matches.map((match) => renderMatchCard(match))
                      )}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
