import type { FetchOptions } from "./types";

export const OPENLIGADB_CACHE_SECONDS = {
  availableLeagues: 60 * 60 * 24,
  groups: 60 * 60 * 24,
  teams: 60 * 60 * 24 * 3,
  table: 60 * 60 * 3,
  currentGroup: 60 * 5,
  liveMatchday: 30,
  liveSchedule: 60 * 15,
  seasonMatches: 60 * 60 * 12,
} as const;

export const withOpenLigaDbCache = (
  options: FetchOptions | undefined,
  revalidate: number,
): FetchOptions => {
  if (options?.cache === "no-store") return options;

  return {
    ...options,
    next: {
      ...options?.next,
      revalidate,
    },
  };
};
