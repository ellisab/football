import {
  isLeagueKey,
  type LeagueKey,
} from "@footballleagues/core/leagues";
import { getMatchKickoffTimestamp } from "@footballleagues/core/matches";
import type { ApiMatch } from "@footballleagues/core/openligadb";
import type { MatchCardItem } from "@/features/football/components/match-card-list";

const POLL_BEFORE_KICKOFF_MS = 30 * 60 * 1_000;
const POLL_AFTER_KICKOFF_MS = 6 * 60 * 60 * 1_000;

export type LiveMatchScope = {
  group: number;
  league: LeagueKey;
  season: number;
};

export type LiveMatchItem = MatchCardItem & {
  scope?: LiveMatchScope;
};

export type MatchdayPollingPayload = {
  checkedAt?: number;
  group: { groupOrderID?: number };
  matches: ApiMatch[];
  refreshFailed?: true;
  refreshState?: "fresh" | "stale";
  resolvedLeague: LeagueKey;
  resolvedSeason: number;
  retryAt?: number;
};

export type LiveDiscoveryPayload = {
  checkedAt: number;
  failedLeagues: LeagueKey[];
  matches: LiveMatchItem[];
  visibleErrors: string[];
};

const getScopeKey = ({ group, league, season }: LiveMatchScope) =>
  `${league}:${season}:${group}`;

export const getPollingScopes = (
  items: readonly LiveMatchItem[],
  now: Date = new Date()
) => {
  const nowTimestamp = now.getTime();
  if (Number.isNaN(nowTimestamp)) return [];

  const scopes = new Map<string, LiveMatchScope>();

  for (const item of items) {
    if (!item.scope || item.match.matchIsFinished) continue;

    const kickoffTimestamp = getMatchKickoffTimestamp(item.match);
    if (kickoffTimestamp === null) continue;

    const untilKickoff = kickoffTimestamp - nowTimestamp;
    if (
      untilKickoff > POLL_BEFORE_KICKOFF_MS ||
      untilKickoff < -POLL_AFTER_KICKOFF_MS
    ) {
      continue;
    }

    scopes.set(getScopeKey(item.scope), item.scope);
  }

  return [...scopes.values()];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isLiveMatchItem = (value: unknown): value is LiveMatchItem => {
  if (
    !isRecord(value) ||
    typeof value.competitionId !== "string" ||
    !isLeagueKey(value.competitionId) ||
    typeof value.competitionLabel !== "string" ||
    typeof value.roundLabel !== "string" ||
    !isRecord(value.match)
  ) {
    return false;
  }

  if (value.scope === undefined) return true;
  if (!isRecord(value.scope)) return false;

  return (
    typeof value.scope.league === "string" &&
    isLeagueKey(value.scope.league) &&
    Number.isInteger(value.scope.season) &&
    Number.isInteger(value.scope.group) &&
    Number(value.scope.group) > 0
  );
};

export const parseLiveDiscoveryPayload = (
  value: unknown
): LiveDiscoveryPayload | undefined => {
  if (
    !isRecord(value) ||
    typeof value.checkedAt !== "number" ||
    !Number.isFinite(value.checkedAt) ||
    !Array.isArray(value.failedLeagues) ||
    !value.failedLeagues.every(
      (league) => typeof league === "string" && isLeagueKey(league)
    ) ||
    !Array.isArray(value.matches) ||
    !value.matches.every(isLiveMatchItem) ||
    !Array.isArray(value.visibleErrors) ||
    !value.visibleErrors.every((error) => typeof error === "string")
  ) {
    return undefined;
  }

  return value as LiveDiscoveryPayload;
};

export const parseMatchdayPollingPayload = (
  value: unknown,
  scope: LiveMatchScope
): MatchdayPollingPayload | undefined => {
  if (!isRecord(value) || !isRecord(value.group)) return undefined;
  if (
    value.resolvedLeague !== scope.league ||
    value.resolvedSeason !== scope.season ||
    value.group.groupOrderID !== scope.group ||
    !Array.isArray(value.matches)
  ) {
    return undefined;
  }

  return value as MatchdayPollingPayload;
};

export const mergeMatchdayPayload = (
  items: readonly LiveMatchItem[],
  payload: MatchdayPollingPayload
): LiveMatchItem[] => {
  const matchesById = new Map(
    payload.matches.flatMap((match) =>
      typeof match.matchID === "number" ? [[match.matchID, match] as const] : []
    )
  );

  return items.map((item) => {
    if (
      item.scope?.league !== payload.resolvedLeague ||
      item.scope.season !== payload.resolvedSeason ||
      item.scope.group !== payload.group.groupOrderID ||
      typeof item.match.matchID !== "number"
    ) {
      return item;
    }

    const match = matchesById.get(item.match.matchID);
    return match ? { ...item, match } : item;
  });
};

const getLiveMatchKey = (item: LiveMatchItem) =>
  typeof item.match.matchID === "number"
    ? `${item.competitionId}:${item.match.matchID}`
    : undefined;

const compareLiveMatchItems = (
  left: LiveMatchItem,
  right: LiveMatchItem
) => {
  const leftKickoff =
    getMatchKickoffTimestamp(left.match) ?? Number.POSITIVE_INFINITY;
  const rightKickoff =
    getMatchKickoffTimestamp(right.match) ?? Number.POSITIVE_INFINITY;
  const byKickoff = leftKickoff - rightKickoff;
  if (byKickoff !== 0) return byKickoff;

  const byCompetition = left.competitionId.localeCompare(
    right.competitionId
  );
  if (byCompetition !== 0) return byCompetition;

  return (left.match.matchID ?? Number.MAX_SAFE_INTEGER) -
    (right.match.matchID ?? Number.MAX_SAFE_INTEGER);
};

export const mergeLiveDiscovery = (
  currentItems: readonly LiveMatchItem[],
  discoveredItems: readonly LiveMatchItem[],
  failedLeagues: readonly LeagueKey[] = []
): LiveMatchItem[] => {
  const currentByKey = new Map(
    currentItems.flatMap((item) => {
      const key = getLiveMatchKey(item);
      return key ? [[key, item] as const] : [];
    })
  );

  const mergedItems = discoveredItems.map((discoveredItem) => {
    const key = getLiveMatchKey(discoveredItem);
    const currentItem = key ? currentByKey.get(key) : undefined;

    return currentItem
      ? {
          ...discoveredItem,
          match: currentItem.match,
        }
      : discoveredItem;
  });

  const discoveredKeys = new Set(
    discoveredItems.flatMap((item) => {
      const key = getLiveMatchKey(item);
      return key ? [key] : [];
    })
  );
  const failedLeagueSet = new Set(failedLeagues);

  for (const currentItem of currentItems) {
    const key = getLiveMatchKey(currentItem);
    if (
      isLeagueKey(currentItem.competitionId) &&
      failedLeagueSet.has(currentItem.competitionId) &&
      (!key || !discoveredKeys.has(key))
    ) {
      mergedItems.push(currentItem);
    }
  }

  return mergedItems.sort(compareLiveMatchItems);
};
