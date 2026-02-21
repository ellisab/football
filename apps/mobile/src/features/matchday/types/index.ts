import type { LeagueKey } from "@footballleagues/core/leagues";
import type { ApiGroup, ApiMatch, ApiTableRow } from "@footballleagues/core/openligadb";

export type BracketRound = {
  group: Pick<ApiGroup, "groupID" | "groupName" | "groupOrderID">;
  matches: ApiMatch[];
};

export type HomeDataState = {
  activeLeague: LeagueKey;
  groupName: string;
  matches: ApiMatch[];
  nextGroupName: string;
  nextMatches: ApiMatch[];
  table: ApiTableRow[];
  bracketMatches: BracketRound[];
  loading: boolean;
  error: string;
};

export type MatchdaySection = {
  key: string;
  title: string;
  subtitle: string;
  type: "match" | "table";
  emptyText: string;
  data: Array<ApiMatch | ApiTableRow>;
};
