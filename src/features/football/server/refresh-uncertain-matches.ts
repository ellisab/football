import {
  getMatchById,
  type ApiMatch,
} from "@footballleagues/core/openligadb";
import { resolveLeagueKey } from "@footballleagues/core/leagues";
import {
  getMatchStatus,
  type CompetitionMatch,
} from "@/features/football/view-utils";

const MAX_REFRESH_MATCHES = 8;
const REFRESH_CONCURRENCY = 4;
const REFRESH_TIMEOUT_MS = 2_000;

type MatchLoader = (matchId: number) => Promise<ApiMatch>;

const loadUncachedMatch: MatchLoader = (matchId) =>
  getMatchById(matchId, {
    cache: "no-store",
    signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
  });

const isRefreshCandidate = (item: CompetitionMatch, now: Date) => {
  const matchId = item.match.matchID;
  if (!Number.isInteger(matchId) || (matchId ?? 0) <= 0) return false;

  const status = getMatchStatus(item.match, now);
  return status === "live" || status === "unknown";
};

export const refreshUncertainMatches = async ({
  loadMatch = loadUncachedMatch,
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

  for (let offset = 0; offset < candidates.length; offset += REFRESH_CONCURRENCY) {
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
      })
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
