import type { LeagueKey, LeagueOption } from "@footballleagues/core/leagues";
import type { ApiGroup, ApiMatch, ApiTableRow } from "@footballleagues/core/openligadb";
import type { LeagueTheme } from "@footballleagues/core/teams";

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
