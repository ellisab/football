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
import { getCurrentSeasonYear, type LeagueKey } from "@footballleagues/core/leagues";
import { formatKickoff } from "@footballleagues/core/matches";
import { getFinalResult, type ApiMatch, type ApiTableRow } from "@footballleagues/core/openligadb";
import {
  getImageRequestHeaders,
  isAllowedImageHost,
  isSvgUrl,
  normalizeIconUrl,
} from "@footballleagues/core/teams";
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

const MATCHDAY_REGEX = /(\d{1,2})\.\s*spieltag/i;
const PLAYOFF_REGEX = /playoffs?/i;

const getMatchdayNumber = (groupName: string) => {
  return groupName.match(MATCHDAY_REGEX)?.[1] ?? null;
};

const getStageLabel = (groupName: string) => {
  const normalized = groupName.trim();
  if (!normalized) return "Matchday";

  const matchdayNumber = getMatchdayNumber(normalized);
  if (matchdayNumber) return `${matchdayNumber}. Spieltag`;

  return normalized;
};

const getLeagueLabel = (league: LeagueKey) => {
  return MOBILE_LEAGUES.find((entry) => entry.key === league)?.label ?? league.toUpperCase();
};

const getSectionKicker = (section: AppSection) => {
  if (section.type === "table") return "Standings";
  if (section.key === "next-matchday") return "Next Round";
  return "Matchday";
};

export default function App() {
  const [activeLeague, setActiveLeague] = useState<LeagueKey>("bl1");
  const [failedIconUrls, setFailedIconUrls] = useState<Record<string, boolean>>({});

  const colorScheme = useColorScheme();
  const theme = useMemo(() => getTheme(colorScheme), [colorScheme]);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const statusBarStyle = "light";

  const season = useMemo(() => getCurrentSeasonYear(), []);

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
  const stageLabel = getStageLabel(groupName);
  const matchdayNumber = getMatchdayNumber(groupName);
  const isChampionsLeaguePlayoffRound =
    activeLeague === "cl" &&
    PLAYOFF_REGEX.test(groupName) &&
    bracketMatches.some((round) => PLAYOFF_REGEX.test(round?.group?.groupName ?? ""));

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
    const result: AppSection[] = [];

    if (!isChampionsLeaguePlayoffRound) {
      result.push({
        key: "matchday",
        title: groupName,
        subtitle: `Season ${season}`,
        type: "match",
        emptyText: error || "No match results available yet for this round.",
        data: matches,
      });
    }

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
  }, [
    activeLeague,
    error,
    groupName,
    isChampionsLeaguePlayoffRound,
    matches,
    nextGroupName,
    nextMatches,
    season,
    table,
  ]);

  const actionCards = useMemo(
    () => [
      {
        label: "Latest",
        title: "Latest Results",
        description: "Track every scoreline from first whistle to final.",
      },
      {
        label: activeLeague === "dfb" ? "Insights" : "Standings",
        title: activeLeague === "dfb" ? "Match Insights" : "Table Shift",
        description:
          activeLeague === "dfb"
            ? "Scan upcoming ties and in-round momentum."
            : "Jump straight to qualification and relegation pressure.",
      },
    ],
    [activeLeague]
  );

  const renderHeader = () => (
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
              onPress={() => setActiveLeague(league.key)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{league.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.heroPanel}>
        <View style={styles.heroPulseOne} />
        <View style={styles.heroPulseTwo} />
        <View style={styles.heroGrid}>
          <View style={styles.heroTagRow}>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagText}>
                {matchdayNumber
                  ? "Live Matchday"
                  : `Live ${stageLabel}`}
              </Text>
            </View>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagText}>{getLeagueLabel(activeLeague)}</Text>
            </View>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagText}>Season {season}</Text>
            </View>
          </View>

          <Text style={styles.heroKicker}>
            {matchdayNumber
              ? "Stadium lights are on"
              : `Live ${stageLabel}`}
          </Text>
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

  const renderMatchCard = (item: ApiMatch) => {
    const finalResult = getFinalResult(item);
    const goalEvents = Array.isArray(item?.goals) ? item.goals : [];
    const score = finalResult
      ? `${finalResult?.pointsTeam1 ?? 0} - ${finalResult?.pointsTeam2 ?? 0}`
      : "- : -";

    return (
      <View
        key={item?.matchID ?? `${item?.team1?.teamId}-${item?.team2?.teamId}`}
        style={styles.card}
      >
        <View style={styles.cardMetaRow}>
          <View style={styles.cardMetaChip}>
            <Text style={styles.cardMetaText}>
              {formatKickoff(item?.matchDateTimeUTC || item?.matchDateTime)}
            </Text>
          </View>
          <View
            style={[
              styles.cardMetaChip,
              item?.matchIsFinished ? styles.cardMetaStatusFinal : styles.cardMetaStatusScheduled,
            ]}
          >
            <Text
              style={[
                styles.cardMetaText,
                item?.matchIsFinished ? styles.cardMetaStatusFinalText : styles.cardMetaStatusScheduledText,
              ]}
            >
              {item?.matchIsFinished ? "Final" : "Scheduled"}
            </Text>
          </View>
        </View>

        <View style={styles.teamRow}>
          <View style={styles.teamLabelRow}>
            {renderTeamBadge(item?.team1?.teamName, item?.team1?.teamIconUrl)}
            <Text style={styles.team} numberOfLines={1}>
              {item?.team1?.teamName || "Home"}
            </Text>
          </View>
          <Text style={styles.score}>{score}</Text>
        </View>

        <View style={[styles.teamLabelRow, styles.teamLabelRowSecondary]}>
          {renderTeamBadge(item?.team2?.teamName, item?.team2?.teamIconUrl)}
          <Text style={styles.team} numberOfLines={1}>
            {item?.team2?.teamName || "Away"}
          </Text>
        </View>

        {goalEvents.length > 0 ? (
          <View style={styles.goalList}>
            {goalEvents.map((goal, index) => (
              <Text
                key={goal?.goalID ?? `${goal?.goalGetterName}-${goal?.matchMinute}-${index}`}
                style={styles.goalItem}
              >
                {goal?.matchMinute ?? "-"}'  {goal?.goalGetterName ?? "Goal"}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  const renderTableRow = (row: ApiTableRow, index: number, total: number) => {
    const isLeader = index === 0;
    const isEurope = index > 0 && index < 4;
    const isBottom = index >= Math.max(total - 3, 0);

    const zoneLabel = isLeader
      ? "Leaders"
      : isEurope
        ? "Europe"
        : isBottom
          ? "Relegation"
          : "Midtable";

    return (
      <View>
        <View
          style={[
            styles.tableRow,
            isLeader && styles.tableRowLeader,
            isEurope && styles.tableRowEurope,
            isBottom && styles.tableRowBottom,
          ]}
        >
          <View style={styles.tableMain}>
            <View
              style={[
                styles.tablePosBadge,
                isLeader && styles.tablePosLeader,
                isEurope && styles.tablePosEurope,
                isBottom && styles.tablePosBottom,
              ]}
            >
              <Text
                style={[
                  styles.tablePosText,
                  isLeader && styles.tablePosTextLeader,
                  isEurope && styles.tablePosTextEurope,
                  isBottom && styles.tablePosTextBottom,
                ]}
              >
                {index + 1}
              </Text>
            </View>
            <View style={styles.tableCellTeam}>
              {renderTeamBadge(row?.teamName, row?.teamIconUrl, 20)}
              <Text style={styles.tableCellTeamText} numberOfLines={1}>
                {row?.teamName ?? "Team"}
              </Text>
            </View>
          </View>

          <View style={styles.tableMeta}>
            <Text style={styles.tableZone}>{zoneLabel}</Text>
            <Text style={styles.tableCellPts}>{row?.points ?? 0} pts</Text>
          </View>
        </View>

        <View style={styles.tableStatsRow}>
          <Text style={styles.tableStat}>MP {row?.matches ?? 0}</Text>
          <Text style={styles.tableStat}>W {row?.won ?? 0}</Text>
          <Text style={styles.tableStat}>D {row?.draw ?? 0}</Text>
          <Text style={styles.tableStat}>L {row?.lost ?? 0}</Text>
          <Text style={styles.tableStat}>GD {row?.goalDiff ?? 0}</Text>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: AppSection }) => (
    <View style={styles.section}>
      <Text style={styles.sectionKicker}>{getSectionKicker(section)}</Text>
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
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <View style={styles.backgroundOrbOne} />
        <View style={styles.backgroundOrbTwo} />
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
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
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          windowSize={7}
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
                <View>
                  <View style={styles.section}>
                    <Text style={styles.sectionKicker}>Knockout</Text>
                    <Text style={styles.sectionTitle}>Champions League Bracket</Text>
                    <Text style={styles.sectionSubtitle}>
                      Knockout rounds based on the latest groups data.
                    </Text>
                  </View>
                  <View style={styles.bracketCard}>
                    {bracketMatches.map((round) => (
                      <View key={round?.group?.groupID ?? round?.group?.groupName}>
                        <View style={styles.section}>
                          <Text style={styles.roundTitle}>{round?.group?.groupName ?? "Round"}</Text>
                        </View>
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
                </View>
              ) : null}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
