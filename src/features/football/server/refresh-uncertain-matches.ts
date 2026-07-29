import { resolveLeagueKey } from "@footballleagues/core/leagues";
import { getMatchKickoffTimestamp } from "@footballleagues/core/matches";
import {
  type ApiMatch,
  getMatchById,
  OPENLIGADB_CACHE_SECONDS,
} from "@footballleagues/core/openligadb";
import {
  type CompetitionMatch,
  getMatchStatus,
} from "@/features/football/view-utils";

const MAX_REFRESH_MATCHES = 8;
const REFRESH_CONCURRENCY = 4;
const REFRESH_TIMEOUT_MS = 2_000;
const MAX_UNKNOWN_REFRESH_AGE_MS = 6 * 60 * 60 * 1_000;

type MatchLoader = (matchId: number) => Promise<ApiMatch>;

const loadCachedMatch: MatchLoader = (matchId) =>
  getMatchById(matchId, {
    next: { revalidate: OPENLIGADB_CACHE_SECONDS.liveMatchday },
    signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
  });

const isRefreshCandidate = (item: CompetitionMatch, now: Date) => {
  const matchId = item.match.matchID;
  if (!Number.isInteger(matchId) || (matchId ?? 0) <= 0) return false;
  if (resolveLeagueKey(item.match) !== item.competition.resolvedLeague) {
    return false;
  }

  const status = getMatchStatus(item.match, now);
  if (status === "live") return true;
  if (status !== "unknown") return false;

  const kickoffTimestamp = getMatchKickoffTimestamp(item.match);
  const nowTimestamp = now.getTime();
  if (kickoffTimestamp === null || Number.isNaN(nowTimestamp)) return false;

  const ageMs = nowTimestamp - kickoffTimestamp;
  return ageMs >= 0 && ageMs <= MAX_UNKNOWN_REFRESH_AGE_MS;
};

export const refreshUncertainMatches = async ({
  loadMatch = loadCachedMatch,
  matches,
  now = new Date(),
}: {
  loadMatch?: MatchLoader;
  matches: CompetitionMatch[];
  now?: Date;
}) => {
  const refreshedMatches = [...matches];
  const candidates = matches
    .map((item, index) => ({ index, item }))
    .filter(({ item }) => isRefreshCandidate(item, now))
    .slice(0, MAX_REFRESH_MATCHES);

  for (
    let offset = 0;
    offset < candidates.length;
    offset += REFRESH_CONCURRENCY
  ) {
    const batch = candidates.slice(offset, offset + REFRESH_CONCURRENCY);
    const refreshedBatch = await Promise.all(
      batch.map(async ({ item }) => {
        const matchId = item.match.matchID as number;

        try {
          const freshMatch = await loadMatch(matchId);
          return freshMatch.matchID === matchId &&
            resolveLeagueKey(freshMatch) === item.competition.resolvedLeague
            ? freshMatch
            : item.match;
        } catch {
          return item.match;
        }
      }),
    );

    refreshedBatch.forEach((match, batchIndex) => {
      const candidate = batch[batchIndex];
      if (!candidate) return;

      refreshedMatches[candidate.index] = {
        ...candidate.item,
        match,
      };
    });
  }

  return refreshedMatches;
};
