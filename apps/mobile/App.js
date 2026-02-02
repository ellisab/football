import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import {
  getCurrentGroup,
  getFinalResult,
  getGroups,
  getMatchdayResults,
  getMatchesByGroup,
  getTable,
} from '@footballleagues/core';

const LEAGUES = [
  { key: 'bl1', label: 'Bundesliga' },
  { key: 'bl2', label: 'Zweite Bundesliga' },
  { key: 'dfb', label: 'DFB-Pokal' },
  { key: 'cl', label: 'Champions League' },
];
const LEAGUE_THEMES = {
  bl1: { accent: '#facc15', accentSoft: 'rgba(250, 204, 21, 0.15)' },
  bl2: { accent: '#38bdf8', accentSoft: 'rgba(56, 189, 248, 0.15)' },
  cl: { accent: '#0ea5e9', accentSoft: 'rgba(14, 165, 233, 0.15)' },
  dfb: { accent: '#f97316', accentSoft: 'rgba(249, 115, 22, 0.15)' },
};
const BASE_ACCENT = '#facc15';
const THEMES = {
  light: {
    background: '#f8fafc',
    card: '#ffffff',
    cardMuted: 'rgba(226, 232, 240, 0.7)',
    text: '#0f172a',
    textMuted: '#475569',
    border: 'rgba(15, 23, 42, 0.12)',
    borderSubtle: 'rgba(15, 23, 42, 0.08)',
    accent: BASE_ACCENT,
    warningText: '#92400e',
    warningBorder: 'rgba(180, 83, 9, 0.35)',
    warningBg: 'rgba(245, 158, 11, 0.2)',
    emptyBg: 'rgba(226, 232, 240, 0.7)',
    logoBg: 'rgba(15, 23, 42, 0.06)',
    logoBorder: 'rgba(15, 23, 42, 0.12)',
  },
  dark: {
    background: '#0b1020',
    card: '#101827',
    cardMuted: 'rgba(15, 23, 42, 0.5)',
    text: '#f8fafc',
    textMuted: '#cbd5f5',
    border: 'rgba(148, 163, 184, 0.18)',
    borderSubtle: 'rgba(148, 163, 184, 0.12)',
    accent: BASE_ACCENT,
    warningText: '#fde68a',
    warningBorder: 'rgba(245, 158, 11, 0.4)',
    warningBg: 'rgba(245, 158, 11, 0.15)',
    emptyBg: 'rgba(15, 23, 42, 0.5)',
    logoBg: 'rgba(255, 255, 255, 0.12)',
    logoBorder: 'rgba(255, 255, 255, 0.15)',
  },
};

const ALLOWED_IMAGE_HOSTS = new Set([
  'upload.wikimedia.org',
  'i.imgur.com',
  'www.bundesliga-reisefuehrer.de',
  'www.bundesliga-logos.com',
  'www.bundesliga.com',
  'www.bundesliga.de',
]);

const kickoffFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const getCurrentSeasonYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 7 ? year : year - 1;
};

const formatKickoff = (value) => {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return kickoffFormatter.format(date);
};

const isAllowedImageHost = (iconUrl) => {
  if (!iconUrl) return false;
  try {
    const { hostname } = new URL(iconUrl);
    return ALLOWED_IMAGE_HOSTS.has(hostname);
  } catch {
    return false;
  }
};

const normalizeIconUrl = (iconUrl) => {
  if (!iconUrl) return undefined;
  try {
    const url = new URL(iconUrl);
    if (url.protocol === 'http:' && ALLOWED_IMAGE_HOSTS.has(url.hostname)) {
      url.protocol = 'https:';
    }
    return url.toString();
  } catch {
    return iconUrl;
  }
};
const getTheme = (scheme) => (scheme === 'dark' ? THEMES.dark : THEMES.light);

const sortGoals = (match) => {
  if (!match?.goals || match.goals.length < 2) return match;
  return {
    ...match,
    goals: [...match.goals].sort(
      (a, b) => (a?.matchMinute ?? 0) - (b?.matchMinute ?? 0)
    ),
  };
};

const isKnockoutGroup = (name) => {
  const value = (name ?? '').toLowerCase();
  return (
    value.includes('achtelfinale') ||
    value.includes('viertelfinale') ||
    value.includes('halbfinale') ||
    value.includes('finale') ||
    value.includes('round of 16') ||
    value.includes('quarter') ||
    value.includes('semi') ||
    value.includes('playoff')
  );
};

export default function App() {
  const [activeLeague, setActiveLeague] = useState('bl1');
  const [groupName, setGroupName] = useState('Latest Matchday');
  const [matches, setMatches] = useState([]);
  const [table, setTable] = useState([]);
  const [bracketMatches, setBracketMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const colorScheme = useColorScheme();
  const theme = useMemo(() => getTheme(colorScheme), [colorScheme]);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const statusBarStyle = colorScheme === 'dark' ? 'light' : 'dark';

  const season = useMemo(() => getCurrentSeasonYear(), []);
  const leagueTheme = LEAGUE_THEMES[activeLeague] ?? {
    accent: theme.accent,
    accentSoft: 'rgba(250, 204, 21, 0.15)',
  };
  const dynamicStyles = useMemo(
    () => ({
      badge: { borderColor: leagueTheme.accent },
      badgeText: { color: leagueTheme.accent },
      tabActive: {
        borderColor: leagueTheme.accent,
        backgroundColor: leagueTheme.accentSoft,
      },
      tabIdle: {
        borderColor: theme.border,
        backgroundColor: theme.cardMuted,
      },
      tabTextActive: { color: leagueTheme.accent, fontWeight: '700' },
    }),
    [leagueTheme, theme]
  );

  const renderTeamBadge = (name, iconUrl, size = 26) => {
    const normalizedUrl = normalizeIconUrl(iconUrl);
    const sizeStyle = { width: size, height: size, borderRadius: size / 2 };
    const textSize = Math.max(10, Math.round(size * 0.45));
    if (normalizedUrl && isAllowedImageHost(normalizedUrl)) {
      return (
        <Image
          source={{ uri: normalizedUrl }}
          accessibilityLabel={name ?? 'Team crest'}
          resizeMode="contain"
          style={[styles.teamLogo, sizeStyle]}
        />
      );
    }

    return (
      <View style={[styles.teamLogoFallback, sizeStyle]}>
        <Text style={[styles.teamLogoFallbackText, { fontSize: textSize }]}>
          {(name ?? 'T').slice(0, 1)}
        </Text>
      </View>
    );
  };

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const dataShortcut = activeLeague === 'cl' ? 'ucl' : activeLeague;
        const groupShortcut = activeLeague === 'cl' ? 'cl' : activeLeague;
        const groupPromise = getCurrentGroup(dataShortcut);
        const tablePromise = getTable(dataShortcut, season);
        const groupsPromise =
          activeLeague === 'cl'
            ? (async () => {
                try {
                  const groups = await getGroups(groupShortcut, season);
                  return { groups, shortcut: groupShortcut };
                } catch {
                  const groups = await getGroups(dataShortcut, season);
                  return { groups, shortcut: dataShortcut };
                }
              })()
            : Promise.resolve({ groups: [], shortcut: dataShortcut });
        const playoffPromise =
          activeLeague === 'cl'
            ? getMatchdayResults(dataShortcut, season, 9)
            : Promise.resolve([]);

        const [group, tableResult, groupsResult, playoffResult] =
          await Promise.allSettled([
          groupPromise,
          tablePromise,
          groupsPromise,
          playoffPromise,
        ]);

        if (!isActive) return;

        if (group.status === 'fulfilled') {
          setGroupName(group.value?.groupName || 'Latest Matchday');
        } else {
          setGroupName('Latest Matchday');
          setError('Some data failed to load. Pull to refresh.');
        }

        if (tableResult.status === 'fulfilled') {
          setTable(Array.isArray(tableResult.value) ? tableResult.value : []);
        } else {
          setTable([]);
        }

        let knockoutGroups = [];
        let knockoutShortcut = dataShortcut;
        if (groupsResult.status === 'fulfilled') {
          const groups = Array.isArray(groupsResult.value?.groups)
            ? groupsResult.value.groups
            : [];
          knockoutShortcut = groupsResult.value?.shortcut ?? dataShortcut;
          knockoutGroups = groups.filter((item) => isKnockoutGroup(item?.groupName));
        }

        const bracket = [];
        if (playoffResult.status === 'fulfilled') {
          const playoffMatches = Array.isArray(playoffResult.value)
            ? playoffResult.value.map(sortGoals)
            : [];
          if (playoffMatches.length > 0) {
            bracket.push({
              group: { groupName: 'Playoffs', groupID: 9 },
              matches: playoffMatches,
            });
          }
        }
        for (const groupItem of knockoutGroups) {
          if (!groupItem?.groupOrderID) continue;
          try {
            const roundMatches = await getMatchesByGroup(
              knockoutShortcut,
              season,
              groupItem.groupOrderID
            );
            bracket.push({
              group: groupItem,
              matches: Array.isArray(roundMatches)
                ? roundMatches.map(sortGoals)
                : [],
            });
          } catch {
            bracket.push({ group: groupItem, matches: [] });
          }
        }
        setBracketMatches(bracket);

        const groupOrderID =
          group.status === 'fulfilled' ? group.value?.groupOrderID : undefined;
        if (!groupOrderID) {
          throw new Error('Missing group order.');
        }
        const matchday = await getMatchdayResults(
          dataShortcut,
          season,
          groupOrderID
        );
        if (!isActive) return;
        setMatches(Array.isArray(matchday) ? matchday.map(sortGoals) : []);
      } catch (err) {
        if (!isActive) return;
        setMatches([]);
        setGroupName('Latest Matchday');
        setTable([]);
        setBracketMatches([]);
        setError('Failed to load matches. Pull to refresh.');
      } finally {
        if (isActive) setLoading(false);
      }
    };

    load();
    return () => {
      isActive = false;
    };
  }, [activeLeague, season]);

  const sections = useMemo(
    () => [
      {
        key: 'matchday',
        title: groupName,
        subtitle: `Season ${season}`,
        type: 'match',
        emptyText:
          error || 'No match results available yet for this matchday.',
        data: matches,
      },
      {
        key: 'table',
        title: 'Table',
        subtitle: 'Updated standings for the selected season.',
        type: 'table',
        emptyText: error || 'Table data is not available yet.',
        data: table,
      },
    ],
    [groupName, season, matches, table, error]
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={[styles.badge, dynamicStyles.badge]}>
        <Text style={[styles.badgeText, dynamicStyles.badgeText]}>
          OpenLigaDB Live
        </Text>
      </View>
      <Text style={styles.title}>Matchday Atlas</Text>
      <Text style={styles.subtitle}>
        Follow the latest matchday results and tables for your favorite leagues.
      </Text>
      <View style={styles.tabs}>
        {LEAGUES.map((league) => {
          const isActive = league.key === activeLeague;
          return (
            <Pressable
              key={league.key}
              onPress={() => setActiveLeague(league.key)}
              style={[styles.tab, isActive ? dynamicStyles.tabActive : dynamicStyles.tabIdle]}
            >
              <Text
                style={[styles.tabText, isActive && dynamicStyles.tabTextActive]}
              >
                {league.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderMatchCard = (item) => {
    const finalResult = getFinalResult(item);
    const score = finalResult
      ? `${finalResult?.pointsTeam1 ?? 0} - ${finalResult?.pointsTeam2 ?? 0}`
      : '–';

    return (
      <View
        key={item?.matchID ?? `${item?.team1?.teamId}-${item?.team2?.teamId}`}
        style={styles.card}
      >
        <View style={styles.cardRow}>
          <Text style={styles.kickoff}>
            {formatKickoff(item?.matchDateTimeUTC || item?.matchDateTime)}
          </Text>
          <Text style={styles.status}>
            {item?.matchIsFinished ? 'Final' : 'Scheduled'}
          </Text>
        </View>
        <View style={styles.cardRow}>
          <View style={styles.teamRow}>
            {renderTeamBadge(item?.team1?.teamName, item?.team1?.teamIconUrl)}
            <Text style={styles.team} numberOfLines={1}>
              {item?.team1?.teamName || 'Home'}
            </Text>
          </View>
          <Text style={styles.score}>{score}</Text>
        </View>
        <View style={styles.teamRow}>
          {renderTeamBadge(item?.team2?.teamName, item?.team2?.teamIconUrl)}
          <Text style={styles.team} numberOfLines={1}>
            {item?.team2?.teamName || 'Away'}
          </Text>
        </View>
        {Array.isArray(item?.goals) && item.goals.length > 0 ? (
          <View style={styles.goalList}>
            {item.goals.map((goal, index) => (
              <Text
                key={goal?.goalID ?? `${goal?.goalGetterName}-${goal?.matchMinute}-${index}`}
                style={styles.goalItem}
              >
                {goal?.matchMinute ?? '-'}' {goal?.goalGetterName ?? 'Goal'}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  const renderTableRow = (row, index, total) => {
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
            {row?.teamName ?? 'Team'}
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

  const renderSectionHeader = ({ section }) => (
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

  const renderSectionItem = ({ item, index, section }) => {
    if (section.type === 'match') {
      return renderMatchCard(item);
    }
    if (section.type === 'table') {
      return renderTableRow(item, index, section.data.length);
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={statusBarStyle} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={leagueTheme.accent} />
          <Text style={styles.loadingText}>Loading matches…</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) =>
            item?.matchID?.toString?.() ||
            item?.teamInfoId?.toString?.() ||
            item?.teamName ||
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
              {activeLeague === 'cl' && bracketMatches.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Champions League Bracket</Text>
                  <Text style={styles.sectionSubtitle}>
                    Knockout rounds based on the latest groups data.
                  </Text>
                  {bracketMatches.map((round) => (
                    <View key={round?.group?.groupID ?? round?.group?.groupName}>
                      <Text style={styles.roundTitle}>
                        {round?.group?.groupName ?? 'Round'}
                      </Text>
                      {round.matches.length === 0 ? (
                        <View style={styles.card}>
                          <Text style={styles.emptyText}>
                            No matches available yet.
                          </Text>
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
          ListFooterComponent={
            <Text style={styles.footerText}>
              Data updates every 60 seconds. Built with Expo + OpenLigaDB.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      marginBottom: 12,
      backgroundColor: theme.cardMuted,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    title: {
      color: theme.text,
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    subtitle: {
      color: theme.textMuted,
      marginTop: 6,
      fontSize: 14,
    },
    groupName: {
      marginTop: 16,
      color: theme.text,
      fontSize: 18,
      fontWeight: '600',
    },
    tabs: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 16,
    },
    tab: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
    },
    tabText: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
    listContent: {
      paddingBottom: 36,
    },
    section: {
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 4,
    },
    sectionSubtitle: {
      color: theme.textMuted,
      marginBottom: 12,
    },
    roundTitle: {
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 2,
      fontSize: 12,
      marginBottom: 6,
      marginTop: 8,
    },
    card: {
      marginHorizontal: 20,
      marginVertical: 8,
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    teamRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      minWidth: 0,
    },
    kickoff: {
      color: theme.textMuted,
      fontSize: 12,
    },
    status: {
      color: theme.textMuted,
      fontSize: 12,
    },
    team: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
    },
    score: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '700',
    },
    teamLogo: {
      backgroundColor: theme.logoBg,
      borderWidth: 1,
      borderColor: theme.logoBorder,
    },
    teamLogoFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.logoBg,
      borderWidth: 1,
      borderColor: theme.logoBorder,
    },
    teamLogoFallbackText: {
      color: theme.text,
      fontWeight: '700',
    },
    goalList: {
      marginTop: 10,
      alignItems: 'center',
    },
    goalItem: {
      color: theme.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    loadingText: {
      marginTop: 12,
      color: theme.textMuted,
    },
    emptyState: {
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.emptyBg,
    },
    emptyText: {
      color: theme.textMuted,
      textAlign: 'center',
    },
    errorBanner: {
      marginHorizontal: 20,
      marginTop: 8,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.warningBorder,
      backgroundColor: theme.warningBg,
    },
    errorText: {
      color: theme.warningText,
      fontSize: 12,
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginHorizontal: 20,
      backgroundColor: theme.card,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.border,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderSubtle,
    },
    tableRowFirst: {
      borderTopWidth: 1,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
    },
    tableRowLast: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      borderBottomLeftRadius: 14,
      borderBottomRightRadius: 14,
      marginBottom: 8,
    },
    tableCellPos: {
      width: 24,
      color: theme.textMuted,
      fontSize: 12,
    },
    tableCellTeam: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
      minWidth: 0,
      marginRight: 8,
    },
    tableCellTeamText: {
      flexShrink: 1,
      color: theme.text,
      fontSize: 13,
      fontWeight: '600',
    },
    tableCellStat: {
      width: 28,
      textAlign: 'center',
      color: theme.textMuted,
      fontSize: 12,
    },
    tableCellPts: {
      width: 32,
      textAlign: 'right',
      color: theme.text,
      fontSize: 13,
      fontWeight: '700',
    },
    footerText: {
      color: theme.textMuted,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 24,
      marginBottom: 12,
    },
  });
