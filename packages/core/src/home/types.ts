import type { LeagueKey, LeagueOption } from "../leagues";
import type { ApiGroup, ApiMatch, ApiTableRow } from "../openligadb";

export type BracketRound = {
  group: Pick<ApiGroup, "groupID" | "groupName" | "groupOrderID">;
  matches: ApiMatch[];
};

export type HomeErrorKey =
  | "current group"
  | "matchday"
  | "table"
  | "groups"
  | "playoffs"
  | "next groups"
  | "next matchday"
  | "knockout rounds";

export type HomeRoundSnapshot = {
  groupName?: string;
  groupOrderID?: number;
  matches: ApiMatch[];
};

export type HomeSnapshot = {
  resolvedLeague: LeagueKey;
  resolvedSeason: number;
  leagueOptions: LeagueOption[];
  currentRound: HomeRoundSnapshot;
  nextRound: HomeRoundSnapshot;
  hasTable: boolean;
  bracketMatches: BracketRound[];
  table: ApiTableRow[];
  errorKeys: HomeErrorKey[];
};
