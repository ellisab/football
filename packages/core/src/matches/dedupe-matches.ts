import type { ApiMatch } from "../openligadb/types";

export const dedupeMatches = (matches: ApiMatch[]) => {
  const seen = new Set<string>();

  return matches.filter((match) => {
    const key =
      match.matchID?.toString() ??
      `${match.team1?.teamId ?? "home"}-${match.team2?.teamId ?? "away"}-${match.matchDateTimeUTC ?? match.matchDateTime ?? "unknown"}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};
