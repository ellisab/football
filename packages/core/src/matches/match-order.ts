import type { ApiMatch } from "../openligadb/types";

const getMatchTime = (match: ApiMatch) => {
  const timestamp = Date.parse(
    match.matchDateTimeUTC ?? match.matchDateTime ?? "",
  );
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

export const compareMatchesByKickoff = (a: ApiMatch, b: ApiMatch) => {
  const byTime = getMatchTime(a) - getMatchTime(b);
  if (byTime !== 0) return byTime;

  return (a.matchID ?? 0) - (b.matchID ?? 0);
};
