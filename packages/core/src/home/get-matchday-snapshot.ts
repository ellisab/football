import {
  getAvailableGroupKeys,
  isLeagueKey,
  pickLeagueEntryForSeason,
  resolveEffectiveLeagueShortcut,
  resolveSeasonSelection,
  type LeagueKey,
} from "../leagues";
import { sortGoals, sortMatchesByKickoff } from "../matches";
import { openLigaDbDataSource, type ApiGroup, type ApiMatch } from "../openligadb";
import type { FootballDataSource, HomeRequestOptions } from "./data-source";
import {
  getGroupsWithFallback,
  normalizeLeagueEntries,
} from "./domain/league-groups";
import {
  loadMatchdayResults,
  type MatchdayCacheStatus,
} from "./domain/matchday-loader";
import { getStatusCode } from "./domain/shared";

export class MatchdaySnapshotError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MatchdaySnapshotError";
    this.status = status;
  }
}

export type MatchdaySnapshot = {
  cacheStatus: MatchdayCacheStatus;
  effectiveShortcut: string;
  group: Pick<ApiGroup, "groupID" | "groupName" | "groupOrderID">;
  lastChanged?: string;
  matches: ApiMatch[];
  resolvedLeague: LeagueKey;
  resolvedSeason: number;
};

const parsePositiveInteger = (value: number | string | undefined) => {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : undefined;
  }

  if (!value) return undefined;

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const getRequestedLeague = (league: string | undefined): LeagueKey => {
  if (!league || !isLeagueKey(league)) {
    throw new MatchdaySnapshotError("Unsupported league.", 400);
  }

  return league;
};

export const getMatchdaySnapshot = async (
  params: {
    group?: number | string;
    league?: string;
    season?: string;
  },
  options?: {
    dataSource?: FootballDataSource;
    requestOptions?: HomeRequestOptions;
  }
): Promise<MatchdaySnapshot> => {
  const requestedLeague = getRequestedLeague(params.league);
  const groupOrderId = parsePositiveInteger(params.group);

  if (!groupOrderId) {
    throw new MatchdaySnapshotError("Missing or invalid matchday group.", 400);
  }

  const dataSource = options?.dataSource ?? openLigaDbDataSource;
  const requestOptions = options?.requestOptions;
  const normalizedGroups = await normalizeLeagueEntries(dataSource, requestOptions);
  const availableGroupKeys = getAvailableGroupKeys(normalizedGroups);

  if (!availableGroupKeys.includes(requestedLeague)) {
    throw new MatchdaySnapshotError("League is not available.", 404);
  }

  const leagueEntries = normalizedGroups.get(requestedLeague) ?? [];
  const resolvedSeason = resolveSeasonSelection({
    entries: leagueEntries,
    requestedSeason: params.season,
  });
  const entryForSeason = pickLeagueEntryForSeason(leagueEntries, resolvedSeason);
  const effectiveShortcut = resolveEffectiveLeagueShortcut(
    requestedLeague,
    entryForSeason?.leagueShortcut
  );

  let groups: ApiGroup[] = [];

  try {
    groups = (
      await getGroupsWithFallback(
        dataSource,
        requestedLeague,
        effectiveShortcut,
        resolvedSeason,
        requestOptions
      )
    ).groups;
  } catch (error) {
    if (getStatusCode(error) !== 404) throw error;
  }

  const group = groups.find((entry) => entry.groupOrderID === groupOrderId);

  if (groups.length > 0 && !group) {
    throw new MatchdaySnapshotError("Matchday group is not available.", 404);
  }

  const matchdayResult = await loadMatchdayResults({
    dataSource,
    groupOrderId,
    lastChangeStrategy: "always",
    leagueShortcut: effectiveShortcut,
    requestOptions,
    season: resolvedSeason,
  });

  return {
    cacheStatus: matchdayResult.cacheStatus,
    effectiveShortcut,
    group: {
      groupID: group?.groupID,
      groupName: group?.groupName ?? matchdayResult.matches[0]?.group?.groupName,
      groupOrderID: groupOrderId,
    },
    lastChanged: matchdayResult.lastChanged,
    matches: sortMatchesByKickoff(matchdayResult.matches.map(sortGoals)),
    resolvedLeague: requestedLeague,
    resolvedSeason,
  };
};
