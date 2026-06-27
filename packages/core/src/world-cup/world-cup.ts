import { isFootballLeague, normalizeText, parseSeasonValue } from "../leagues";
import {
  getFinalResult,
  openLigaDbDataSource,
  type ApiGroup,
  type ApiGroupTable,
  type ApiLeague,
  type ApiMatch,
  type ApiTableRow,
  type ApiTeam,
  type FetchOptions,
} from "../openligadb";
import {
  isKnockoutGroup,
  localizeGroupName,
  sortGoals,
  sortMatchesByKickoff,
} from "../matches";
import {
  WORLD_CUP_SEASON,
  type WorldCupDataSource,
  type WorldCupErrorKey,
  type WorldCupGroupSection,
  type WorldCupKnockoutRound,
  type WorldCupSnapshot,
  type WorldCupTableSource,
} from "./types";

const WORLD_CUP_KEYWORD_REGEX =
  /\b(world\s*cup|weltmeisterschaft|wm|fifa|wc[-_\s]*\d{4})\b/i;
const NOISY_LEAGUE_REGEX = /\b(dummy|test|freundschaft|friendly|tippspiel)\b/i;
const WOMENS_LEAGUE_REGEX = /\b(frauen|women|women's|fwm)\b/i;
const COMPLETE_WORLD_CUP_GROUP_COUNT = 12;
const COMPLETE_WORLD_CUP_TEAM_COUNT = 48;
const MAX_WORLD_CUP_PROBE_CANDIDATES = 6;

type WorldCupLeagueCandidate = {
  league: ApiLeague;
  score: number;
  sourceIndex: number;
};

type WorldCupLeagueProbe = WorldCupLeagueCandidate & {
  groupTables: ApiGroupTable[];
  tableLoaded: boolean;
};

const getWorldCupLeagueCandidates = (
  leagues: ApiLeague[],
  season: number
): WorldCupLeagueCandidate[] => {
  const matchingLeagues = leagues
    .map((league, sourceIndex) => ({ league, sourceIndex }))
    .filter(({ league }) => parseSeasonValue(league.leagueSeason) === season)
    .filter(({ league }) => isFootballLeague(league))
    .filter(({ league }) => {
      const combined = `${league.leagueName ?? ""} ${league.leagueShortcut ?? ""}`;
      return WORLD_CUP_KEYWORD_REGEX.test(combined);
    });
  const preferredLeagues = matchingLeagues.filter(({ league }) => {
    const combined = `${league.leagueName ?? ""} ${league.leagueShortcut ?? ""}`;
    return (
      !WOMENS_LEAGUE_REGEX.test(combined) &&
      !NOISY_LEAGUE_REGEX.test(combined)
    );
  });
  const candidatePool =
    preferredLeagues.length > 0 ? preferredLeagues : matchingLeagues;

  return candidatePool
    .map(({ league, sourceIndex }) => {
      const combined = `${league.leagueName ?? ""} ${league.leagueShortcut ?? ""}`;
      let score = 0;

      if (
        /\b(world\s*cup|weltmeisterschaft|wm)\b/i.test(combined)
      ) {
        score += 8;
      }
      if (new RegExp(String(season)).test(combined)) score += 3;

      return { league, score, sourceIndex };
    })
    .sort((a, b) => {
      const byScore = b.score - a.score;
      if (byScore !== 0) return byScore;

      const byLeagueId =
        (a.league.leagueId ?? Number.MAX_SAFE_INTEGER) -
        (b.league.leagueId ?? Number.MAX_SAFE_INTEGER);
      if (byLeagueId !== 0) return byLeagueId;

      const aShortcut = a.league.leagueShortcut ?? "";
      const bShortcut = b.league.leagueShortcut ?? "";
      return (
        aShortcut.length - bShortcut.length ||
        aShortcut.localeCompare(bShortcut) ||
        a.sourceIndex - b.sourceIndex
      );
    });
};

const getGroupTableQuality = (groupTables: ApiGroupTable[]) => {
  return groupTables.reduce(
    (quality, groupTable) => {
      const teamCount = groupTable.teams?.length ?? 0;
      if (teamCount > 0) quality.groupCount += 1;
      quality.teamCount += teamCount;
      return quality;
    },
    { groupCount: 0, teamCount: 0 }
  );
};

const hasCompleteWorldCupGroupTable = (groupTables: ApiGroupTable[]) => {
  const quality = getGroupTableQuality(groupTables);

  return (
    quality.groupCount >= COMPLETE_WORLD_CUP_GROUP_COUNT &&
    quality.teamCount >= COMPLETE_WORLD_CUP_TEAM_COUNT
  );
};

const selectBestWorldCupLeagueProbe = (probes: WorldCupLeagueProbe[]) => {
  return [...probes].sort((a, b) => {
    const aQuality = getGroupTableQuality(a.groupTables);
    const bQuality = getGroupTableQuality(b.groupTables);
    const byGroupCount = bQuality.groupCount - aQuality.groupCount;
    if (byGroupCount !== 0) return byGroupCount;

    const byTeamCount = bQuality.teamCount - aQuality.teamCount;
    if (byTeamCount !== 0) return byTeamCount;

    const byScore = b.score - a.score;
    if (byScore !== 0) return byScore;

    const byLeagueId =
      (a.league.leagueId ?? Number.MAX_SAFE_INTEGER) -
      (b.league.leagueId ?? Number.MAX_SAFE_INTEGER);
    if (byLeagueId !== 0) return byLeagueId;

    return a.sourceIndex - b.sourceIndex;
  })[0];
};

const normalizeGroupComparable = (value?: string) => {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(gruppe|group)\b/g, "")
    .replace(/[^a-z0-9]+/g, "");
};

const getGroupOrder = (group: Pick<ApiGroup, "groupOrderID" | "groupID">) => {
  return group.groupOrderID ?? group.groupID ?? Number.MAX_SAFE_INTEGER;
};

const sortGroups = (groups: ApiGroup[]) => {
  return [...groups].sort((a, b) => {
    const byOrder = getGroupOrder(a) - getGroupOrder(b);
    if (byOrder !== 0) return byOrder;

    return (a.groupName ?? "").localeCompare(b.groupName ?? "");
  });
};

const getMatchGroupKey = (match: ApiMatch) => {
  if (typeof match.group?.groupOrderID === "number") {
    return `order:${match.group.groupOrderID}`;
  }

  if (typeof match.group?.groupID === "number") {
    return `id:${match.group.groupID}`;
  }

  return `name:${normalizeGroupComparable(match.group?.groupName)}`;
};

const getGroupKey = (group: ApiGroup) => {
  if (typeof group.groupOrderID === "number") {
    return `order:${group.groupOrderID}`;
  }

  if (typeof group.groupID === "number") {
    return `id:${group.groupID}`;
  }

  return `name:${normalizeGroupComparable(group.groupName)}`;
};

const isSameNamedGroup = (left?: string, right?: string) => {
  const normalizedLeft = normalizeGroupComparable(left);
  const normalizedRight = normalizeGroupComparable(right);

  return (
    normalizedLeft.length > 0 &&
    normalizedRight.length > 0 &&
    normalizedLeft === normalizedRight
  );
};

const getTeamKey = (team?: ApiTeam) => {
  if (!team) return undefined;
  if (typeof team.teamId === "number") return `id:${team.teamId}`;

  const name = team.teamName ?? team.shortName;
  return name ? `name:${normalizeText(name)}` : undefined;
};

const createEmptyStandingRow = (team: ApiTeam): Required<ApiTableRow> => {
  return {
    teamInfoId: team.teamId ?? 0,
    teamName: team.teamName ?? team.shortName ?? "Offen",
    shortName: team.shortName ?? team.teamName ?? "Offen",
    teamIconUrl: team.teamIconUrl ?? "",
    teamGroupName: team.teamGroupName ?? "",
    points: 0,
    opponentGoals: 0,
    goals: 0,
    matches: 0,
    won: 0,
    lost: 0,
    draw: 0,
    goalDiff: 0,
  };
};

const addTeamToStandingMap = (
  standings: Map<string, Required<ApiTableRow>>,
  team?: ApiTeam
) => {
  const key = getTeamKey(team);
  if (!key || !team) return;

  if (!standings.has(key)) {
    standings.set(key, createEmptyStandingRow(team));
  }
};

const getGroupTeams = (teams: ApiTeam[], groupName?: string) => {
  return teams.filter((team) => isSameNamedGroup(team.teamGroupName, groupName));
};

const tableRowToTeam = (row: ApiTableRow): ApiTeam => ({
  teamId: row.teamInfoId,
  teamName: row.teamName,
  shortName: row.shortName,
  teamIconUrl: row.teamIconUrl,
  teamGroupName: row.teamGroupName,
});

const uniqueTeams = (teams: ApiTeam[]) => {
  const seen = new Set<string>();
  const unique: ApiTeam[] = [];

  for (const team of teams) {
    const key = getTeamKey(team);
    if (!key || seen.has(key)) continue;

    seen.add(key);
    unique.push(team);
  }

  return unique;
};

const createTeamGroupLookup = ({
  teams,
  groupTables,
}: {
  teams: ApiTeam[];
  groupTables: ApiGroupTable[];
}) => {
  const byId = new Map<number, string>();
  const byName = new Map<string, string>();

  for (const team of teams) {
    if (!team.teamGroupName) continue;

    if (typeof team.teamId === "number") {
      byId.set(team.teamId, team.teamGroupName);
    }

    if (team.teamName) byName.set(normalizeText(team.teamName), team.teamGroupName);
    if (team.shortName) byName.set(normalizeText(team.shortName), team.teamGroupName);
  }

  for (const groupTable of groupTables) {
    if (!groupTable.teamGroupName) continue;

    for (const row of groupTable.teams ?? []) {
      if (typeof row.teamInfoId === "number") {
        byId.set(row.teamInfoId, groupTable.teamGroupName);
      }

      if (row.teamName) byName.set(normalizeText(row.teamName), groupTable.teamGroupName);
      if (row.shortName) byName.set(normalizeText(row.shortName), groupTable.teamGroupName);
    }
  }

  return { byId, byName };
};

const getTeamGroupName = (
  team: ApiTeam | undefined,
  lookup: ReturnType<typeof createTeamGroupLookup>
) => {
  if (!team) return undefined;
  if (team.teamGroupName) return team.teamGroupName;
  if (typeof team.teamId === "number") return lookup.byId.get(team.teamId);

  return (
    (team.teamName ? lookup.byName.get(normalizeText(team.teamName)) : undefined) ??
    (team.shortName ? lookup.byName.get(normalizeText(team.shortName)) : undefined)
  );
};

const hasCompleteApiTable = ({
  apiRows,
  groupTeams,
  matches,
}: {
  apiRows: ApiTableRow[];
  groupTeams: ApiTeam[];
  matches: ApiMatch[];
}) => {
  if (apiRows.length === 0) return false;

  const expectedTeamKeys = new Set<string>();
  for (const team of groupTeams) {
    const key = getTeamKey(team);
    if (key) expectedTeamKeys.add(key);
  }

  for (const match of matches) {
    const team1Key = getTeamKey(match.team1);
    const team2Key = getTeamKey(match.team2);
    if (team1Key) expectedTeamKeys.add(team1Key);
    if (team2Key) expectedTeamKeys.add(team2Key);
  }

  return expectedTeamKeys.size === 0 || apiRows.length >= expectedTeamKeys.size;
};

const getTableGroupRank = (groupName?: string) => {
  const comparable = normalizeGroupComparable(groupName);
  const number = Number.parseInt(comparable, 10);
  if (!Number.isNaN(number)) return number;

  if (/^[a-z]$/.test(comparable)) {
    return comparable.charCodeAt(0) - "a".charCodeAt(0) + 1;
  }

  return Number.MAX_SAFE_INTEGER;
};

const sortGroupTables = (groupTables: ApiGroupTable[]) => {
  return [...groupTables].sort((a, b) => {
    const byRank = getTableGroupRank(a.teamGroupName) - getTableGroupRank(b.teamGroupName);
    if (byRank !== 0) return byRank;

    return (
      (a.teamGroupId ?? Number.MAX_SAFE_INTEGER) -
        (b.teamGroupId ?? Number.MAX_SAFE_INTEGER) ||
      (a.teamGroupName ?? "").localeCompare(b.teamGroupName ?? "")
    );
  });
};

const getMatchesForTeamGroup = ({
  groupName,
  matches,
  teamGroupLookup,
}: {
  groupName?: string;
  matches: ApiMatch[];
  teamGroupLookup: ReturnType<typeof createTeamGroupLookup>;
}) => {
  return sortMatchesByKickoff(
    matches.filter((match) => {
      const team1Group = getTeamGroupName(match.team1, teamGroupLookup);
      const team2Group = getTeamGroupName(match.team2, teamGroupLookup);

      return (
        isSameNamedGroup(team1Group, groupName) ||
        isSameNamedGroup(team2Group, groupName)
      );
    })
  );
};

const createGroupSectionsFromTables = ({
  groupTables,
  teams,
  groupStageMatches,
}: {
  groupTables: ApiGroupTable[];
  teams: ApiTeam[];
  groupStageMatches: ApiMatch[];
}) => {
  const teamGroupLookup = createTeamGroupLookup({ teams, groupTables });
  const sortedGroupTables = sortGroupTables(groupTables);

  if (sortedGroupTables.length > 0) {
    return sortedGroupTables.map((groupTable, index): WorldCupGroupSection => {
      const groupName = groupTable.teamGroupName ?? `Gruppe ${index + 1}`;
      const apiRows = (groupTable.teams ?? []).map((row) => ({
        ...row,
        teamGroupName: row.teamGroupName ?? groupName,
      }));
      const tableTeams = apiRows.map(tableRowToTeam);
      const groupTeams = uniqueTeams([...getGroupTeams(teams, groupName), ...tableTeams]);
      const groupMatches = getMatchesForTeamGroup({
        groupName,
        matches: groupStageMatches,
        teamGroupLookup,
      });
      const shouldUseApiTable = hasCompleteApiTable({
        apiRows,
        groupTeams,
        matches: groupMatches,
      });
      const derivedRows = shouldUseApiTable
        ? []
        : deriveGroupStandings(groupMatches, groupTeams);
      const table = shouldUseApiTable ? apiRows : derivedRows;
      const tableSource: WorldCupTableSource =
        table.length === 0 ? "none" : shouldUseApiTable ? "api" : "derived";

      return {
        group: {
          groupID: groupTable.teamGroupId,
          groupName,
          groupOrderID: index + 1,
        },
        title: localizeGroupName(groupName) || "Gruppe",
        matches: groupMatches,
        table,
        tableSource,
      };
    });
  }

  const teamGroups = Array.from(
    new Set(
      teams
        .map((team) => team.teamGroupName)
        .filter((groupName): groupName is string => Boolean(groupName))
    )
  );

  return teamGroups
    .sort((a, b) => getTableGroupRank(a) - getTableGroupRank(b) || a.localeCompare(b))
    .map((groupName, index): WorldCupGroupSection => {
      const groupTeams = getGroupTeams(teams, groupName);
      const groupMatches = getMatchesForTeamGroup({
        groupName,
        matches: groupStageMatches,
        teamGroupLookup,
      });
      const table = deriveGroupStandings(groupMatches, groupTeams);

      return {
        group: {
          groupName,
          groupOrderID: index + 1,
        },
        title: localizeGroupName(groupName) || "Gruppe",
        matches: groupMatches,
        table,
        tableSource: table.length === 0 ? "none" : "derived",
      };
    });
};

export const discoverWorldCupLeague = (
  leagues: ApiLeague[],
  season: number = WORLD_CUP_SEASON
) => {
  return getWorldCupLeagueCandidates(leagues, season)[0]?.league;
};

export const deriveGroupStandings = (
  matches: ApiMatch[],
  groupTeams: ApiTeam[] = []
): ApiTableRow[] => {
  const standings = new Map<string, Required<ApiTableRow>>();

  for (const team of groupTeams) {
    addTeamToStandingMap(standings, team);
  }

  for (const match of matches) {
    addTeamToStandingMap(standings, match.team1);
    addTeamToStandingMap(standings, match.team2);

    if (match.matchIsFinished !== true) continue;

    const result = getFinalResult(match);
    const team1Key = getTeamKey(match.team1);
    const team2Key = getTeamKey(match.team2);

    if (
      !result ||
      !team1Key ||
      !team2Key ||
      typeof result.pointsTeam1 !== "number" ||
      typeof result.pointsTeam2 !== "number"
    ) {
      continue;
    }

    const team1 = standings.get(team1Key);
    const team2 = standings.get(team2Key);
    if (!team1 || !team2) continue;

    team1.matches += 1;
    team2.matches += 1;
    team1.goals += result.pointsTeam1;
    team1.opponentGoals += result.pointsTeam2;
    team2.goals += result.pointsTeam2;
    team2.opponentGoals += result.pointsTeam1;
    team1.goalDiff = team1.goals - team1.opponentGoals;
    team2.goalDiff = team2.goals - team2.opponentGoals;

    if (result.pointsTeam1 > result.pointsTeam2) {
      team1.won += 1;
      team2.lost += 1;
      team1.points += 3;
    } else if (result.pointsTeam1 < result.pointsTeam2) {
      team2.won += 1;
      team1.lost += 1;
      team2.points += 3;
    } else {
      team1.draw += 1;
      team2.draw += 1;
      team1.points += 1;
      team2.points += 1;
    }
  }

  return [...standings.values()].sort((a, b) => {
    const byPoints = b.points - a.points;
    if (byPoints !== 0) return byPoints;

    const byGoalDiff = b.goalDiff - a.goalDiff;
    if (byGoalDiff !== 0) return byGoalDiff;

    const byGoals = b.goals - a.goals;
    if (byGoals !== 0) return byGoals;

    return a.teamName.localeCompare(b.teamName);
  });
};

const getGroupMatches = (group: ApiGroup, matches: ApiMatch[]) => {
  const groupKey = getGroupKey(group);

  return sortMatchesByKickoff(
    matches.filter((match) => {
      if (getMatchGroupKey(match) === groupKey) return true;

      return isSameNamedGroup(match.group?.groupName, group.groupName);
    })
  );
};

const deriveGroupsFromMatches = (matches: ApiMatch[]) => {
  const groupsByKey = new Map<string, ApiGroup>();

  for (const match of matches) {
    if (!match.group) continue;

    const key = getMatchGroupKey(match);
    if (!groupsByKey.has(key)) {
      groupsByKey.set(key, match.group);
    }
  }

  return sortGroups([...groupsByKey.values()]);
};

export const createWorldCupSnapshot = ({
  league,
  season = WORLD_CUP_SEASON,
  groups,
  matches,
  teams = [],
  groupTables = [],
  errors = [],
}: {
  league: ApiLeague;
  season?: number;
  groups: ApiGroup[];
  matches: ApiMatch[];
  teams?: ApiTeam[];
  groupTables?: ApiGroupTable[];
  errors?: WorldCupErrorKey[];
}): WorldCupSnapshot => {
  const sortedMatches = sortMatchesByKickoff(matches.map(sortGoals));
  const resolvedGroups = sortGroups(groups.length > 0 ? groups : deriveGroupsFromMatches(matches));
  const groupStageMatches = sortedMatches.filter(
    (match) => !isKnockoutGroup(match.group?.groupName)
  );
  const knockoutGroups = resolvedGroups.filter((group) =>
    isKnockoutGroup(group.groupName)
  );
  const tableGroupSections = createGroupSectionsFromTables({
    groupTables,
    teams,
    groupStageMatches,
  });
  const groupSections: WorldCupGroupSection[] =
    tableGroupSections.length > 0
      ? tableGroupSections
      : resolvedGroups
          .filter((group) => !isKnockoutGroup(group.groupName))
          .map((group) => {
            const groupMatches = getGroupMatches(group, sortedMatches);
            const groupTeams = getGroupTeams(teams, group.groupName);
            const table = deriveGroupStandings(groupMatches, groupTeams);

            return {
              group,
              title: localizeGroupName(group.groupName) || "Gruppe",
              matches: groupMatches,
              table,
              tableSource: table.length === 0 ? "none" : "derived",
            };
          });

  const knockoutRounds: WorldCupKnockoutRound[] = knockoutGroups.map((group) => ({
    group,
    title: localizeGroupName(group.groupName) || "K.-o.-Runde",
    matches: getGroupMatches(group, sortedMatches),
  }));

  return {
    status: "ready",
    season,
    leagueName: league.leagueName ?? "Weltmeisterschaft",
    leagueShortcut: league.leagueShortcut,
    groups: resolvedGroups,
    groupSections,
    knockoutRounds,
    errors: Array.from(new Set(errors)),
  };
};

const createEmptyWorldCupSnapshot = ({
  season,
  errors = [],
  emptyReason,
}: {
  season: number;
  errors?: WorldCupErrorKey[];
  emptyReason: string;
}): WorldCupSnapshot => {
  return {
    status: errors.includes("discovery") ? "error" : "empty",
    season,
    leagueName: "Weltmeisterschaft",
    groups: [],
    groupSections: [],
    knockoutRounds: [],
    errors: Array.from(new Set(errors)),
    emptyReason,
  };
};

const capture = async <T>(
  task: Promise<T>,
  fallback: T,
  errorKey: WorldCupErrorKey,
  errors: WorldCupErrorKey[]
) => {
  try {
    return await task;
  } catch {
    errors.push(errorKey);
    return fallback;
  }
};

export const getWorldCupSnapshot = async ({
  season = WORLD_CUP_SEASON,
  dataSource = openLigaDbDataSource,
  requestOptions,
  now = () => new Date(),
}: {
  season?: number;
  dataSource?: WorldCupDataSource;
  requestOptions?: FetchOptions;
  now?: () => Date;
} = {}): Promise<WorldCupSnapshot> => {
  const errors: WorldCupErrorKey[] = [];
  const leagues = await capture(
    dataSource.getAvailableLeaguesBySeason(season, requestOptions),
    [],
    "discovery",
    errors
  );

  if (errors.includes("discovery")) {
    return createEmptyWorldCupSnapshot({
      season,
      errors,
      emptyReason: "Die WM-Liga konnte bei OpenLigaDB gerade nicht gesucht werden.",
    });
  }

  const leagueCandidates = getWorldCupLeagueCandidates(leagues, season);
  if (leagueCandidates.length === 0) {
    return createEmptyWorldCupSnapshot({
      season,
      emptyReason:
        "OpenLigaDB hat für die Saison 2026 noch keine WM-Liga veröffentlicht.",
    });
  }

  const probeLeague = async (
    candidate: WorldCupLeagueCandidate
  ): Promise<WorldCupLeagueProbe> => {
    const leagueShortcut = candidate.league.leagueShortcut;
    if (!leagueShortcut) {
      return {
        ...candidate,
        groupTables: [],
        tableLoaded: false,
      };
    }

    try {
      return {
        ...candidate,
        groupTables: await dataSource.getGroupTable(
          leagueShortcut,
          season,
          requestOptions
        ),
        tableLoaded: true,
      };
    } catch {
      return {
        ...candidate,
        groupTables: [],
        tableLoaded: false,
      };
    }
  };

  const probeCandidates = leagueCandidates.slice(0, MAX_WORLD_CUP_PROBE_CANDIDATES);
  const firstProbe = await probeLeague(probeCandidates[0]);
  const leagueProbes = hasCompleteWorldCupGroupTable(firstProbe.groupTables)
    ? [firstProbe]
    : [
        firstProbe,
        ...(await Promise.all(probeCandidates.slice(1).map(probeLeague))),
      ];
  const selectedProbe = selectBestWorldCupLeagueProbe(leagueProbes);
  const league = selectedProbe?.league;
  if (!selectedProbe || !league?.leagueShortcut) {
    return createEmptyWorldCupSnapshot({
      season,
      emptyReason:
        "OpenLigaDB hat für die Saison 2026 noch keine verwendbare WM-Liga veröffentlicht.",
    });
  }
  if (!selectedProbe.tableLoaded) {
    errors.push("table");
  }

  const [groups, matches, teams] = await Promise.all([
    capture(
      dataSource.getGroups(league.leagueShortcut, season, requestOptions),
      [],
      "groups",
      errors
    ),
    capture(
      dataSource.getAllMatches(league.leagueShortcut, season, requestOptions),
      [],
      "matches",
      errors
    ),
    capture(
      dataSource.getAvailableTeams(league.leagueShortcut, season, requestOptions),
      [],
      "teams",
      errors
    ),
  ]);

  const snapshot = createWorldCupSnapshot({
    league,
    season,
    groups,
    matches,
    teams,
    groupTables: selectedProbe.groupTables,
    errors,
  });

  if (errors.includes("matches")) {
    return {
      ...snapshot,
      status: "error",
      emptyReason: "Die WM-Spiele konnten gerade nicht geladen werden.",
    };
  }

  return {
    ...snapshot,
    lastUpdated: now().toISOString(),
  };
};
