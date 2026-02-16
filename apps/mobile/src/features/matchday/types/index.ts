import type {
  ApiGroup,
  ApiMatch,
  ApiTableRow,
  LeagueKey,
} from "@footballleagues/core";

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
