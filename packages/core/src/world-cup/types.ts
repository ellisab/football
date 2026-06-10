import type {
  ApiGroup,
  ApiGroupTable,
  ApiLeague,
  ApiMatch,
  ApiTableRow,
  ApiTeam,
  FetchOptions,
} from "../openligadb";

export const WORLD_CUP_LEAGUE_KEY = "wc" as const;
export const WORLD_CUP_SEASON = 2026;

export type WorldCupDataSource = {
  getAvailableLeaguesBySeason(
    season: number,
    options?: FetchOptions
  ): Promise<ApiLeague[]>;
  getGroups(
    leagueShortcut: string,
    season: number,
    options?: FetchOptions
  ): Promise<ApiGroup[]>;
  getAllMatches(
    leagueShortcut: string,
    season: number,
    options?: FetchOptions
  ): Promise<ApiMatch[]>;
  getGroupTable(
    leagueShortcut: string,
    season: number,
    options?: FetchOptions
  ): Promise<ApiGroupTable[]>;
  getAvailableTeams(
    leagueShortcut: string,
    season: number,
    options?: FetchOptions
  ): Promise<ApiTeam[]>;
};

export type WorldCupErrorKey = "discovery" | "groups" | "matches" | "table" | "teams";

export type WorldCupTableSource = "api" | "derived" | "none";

export type WorldCupGroupSection = {
  group: Pick<ApiGroup, "groupID" | "groupName" | "groupOrderID">;
  title: string;
  matches: ApiMatch[];
  table: ApiTableRow[];
  tableSource: WorldCupTableSource;
};

export type WorldCupKnockoutRound = {
  group: Pick<ApiGroup, "groupID" | "groupName" | "groupOrderID">;
  title: string;
  matches: ApiMatch[];
};

export type WorldCupSnapshot = {
  status: "ready" | "empty" | "error";
  season: number;
  leagueName: string;
  leagueShortcut?: string;
  lastUpdated?: string;
  groups: ApiGroup[];
  groupSections: WorldCupGroupSection[];
  knockoutRounds: WorldCupKnockoutRound[];
  errors: WorldCupErrorKey[];
  emptyReason?: string;
};
