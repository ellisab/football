import type {
  ApiGroup,
  ApiMatch,
  ApiTableRow,
  LeagueKey,
  LeagueOption,
  LeagueTheme,
} from "@footballleagues/core";

export type BracketRound = {
  group: Pick<ApiGroup, "groupID" | "groupName" | "groupOrderID">;
  matches: ApiMatch[];
};

export type DesignDirection = "stadium" | "gazette";

export type HomeData = {
  direction: DesignDirection;
  resolvedLeague: LeagueKey;
  resolvedSeason: number;
  activeLeagueLabel: string;
  theme: LeagueTheme;
  leagueOptions: LeagueOption[];
  currentGroupName: string;
  matches: ApiMatch[];
  nextRoundMatches: ApiMatch[];
  nextRoundLabel: string;
  showInlineTable: boolean;
  showSidebarTable: boolean;
  bracketMatches: BracketRound[];
  table: ApiTableRow[];
  visibleErrors: string[];
};
