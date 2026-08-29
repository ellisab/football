import type { LeagueKey } from "../leagues";

export const SUPPORTED_BROADCAST_LEAGUES = [
  "bl1",
  "bl2",
  "cl",
] as const satisfies readonly LeagueKey[];

export type SupportedBroadcastLeague =
  (typeof SUPPORTED_BROADCAST_LEAGUES)[number];

export const isSupportedBroadcastLeague = (
  value: unknown,
): value is SupportedBroadcastLeague => {
  return (
    typeof value === "string" &&
    SUPPORTED_BROADCAST_LEAGUES.some((league) => league === value)
  );
};

export type BroadcastAccess = "free" | "subscription";
export type BroadcastCoverage = "conference" | "individual";
export type BroadcastMedium = "stream" | "tv";
export type BroadcastOwnership = "private" | "public";
export type BroadcastCertainty = "rights-rule" | "verified";

export const BROADCASTER_ORDER = [
  "sat1",
  "rtl",
  "nitro",
  "rtl-nitro",
  "sky",
  "wow",
  "rtl-plus",
  "prime-video",
  "dazn",
] as const;

export type BroadcasterId = (typeof BROADCASTER_ORDER)[number];

export type Broadcaster = {
  access: BroadcastAccess;
  id: BroadcasterId;
  medium: BroadcastMedium;
  name: string;
  ownership: BroadcastOwnership;
  shortName: string;
};

export type MatchBroadcast = Broadcaster & {
  certainty: BroadcastCertainty;
  coverage: BroadcastCoverage;
  note?: string;
  sourceUrl: string;
};

export type ManualBroadcastSelection = {
  broadcasterId: BroadcasterId;
  coverage: BroadcastCoverage;
};

export type ManualBroadcastOverride = {
  awayTeamId: number;
  broadcasters: ManualBroadcastSelection[];
  competitionId: SupportedBroadcastLeague;
  homeTeamId: number;
  kickoffUtc: string;
  matchId: number;
  matchKey: string;
  note?: string;
  season: number;
  sourceUrl: string;
  verifiedAt: string;
};

export type MatchBroadcastResolution = {
  broadcasts: MatchBroadcast[];
  status: "available" | "unconfirmed" | "unsupported";
};
