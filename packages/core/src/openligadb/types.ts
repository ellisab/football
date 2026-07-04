export type ApiGroup = {
  groupName?: string;
  groupOrderID?: number;
  groupID?: number;
};

export type ApiTeam = {
  teamId?: number;
  teamName?: string;
  shortName?: string;
  teamIconUrl?: string;
  teamGroupName?: string;
};

export type ApiMatchResult = {
  resultID?: number;
  resultName?: string;
  pointsTeam1?: number;
  pointsTeam2?: number;
  resultOrderID?: number;
  resultTypeID?: number;
  resultDescription?: string;
};

export type ApiGoal = {
  goalID?: number;
  scoreTeam1?: number;
  scoreTeam2?: number;
  matchMinute?: number;
  goalGetterName?: string;
  isPenalty?: boolean;
  isOwnGoal?: boolean;
  isOvertime?: boolean;
};

export type ApiMatch = {
  matchID?: number;
  matchDateTime?: string;
  matchDateTimeUTC?: string;
  leagueId?: number;
  leagueName?: string;
  leagueSeason?: number;
  leagueShortcut?: string;
  group?: ApiGroup;
  team1?: ApiTeam;
  team2?: ApiTeam;
  timeZoneID?: string;
  lastUpdateDateTime?: string;
  matchIsFinished?: boolean;
  matchResults?: ApiMatchResult[];
  goals?: ApiGoal[];
  location?: {
    locationID?: number;
    locationCity?: string;
    locationStadium?: string;
  };
};

export type ApiLeague = {
  leagueId?: number;
  leagueName?: string;
  leagueSeason?: number | string;
  leagueShortcut?: string;
  sport?: {
    sportId?: number;
    sportName?: string;
  };
};

export type ApiTableRow = {
  teamInfoId?: number;
  teamName?: string;
  shortName?: string;
  teamIconUrl?: string;
  teamGroupName?: string;
  points?: number;
  opponentGoals?: number;
  goals?: number;
  matches?: number;
  won?: number;
  lost?: number;
  draw?: number;
  goalDiff?: number;
};

export type ApiGroupTable = {
  teamGroupId?: number;
  teamGroupName?: string;
  teams?: ApiTableRow[];
};

export type FetchOptions = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};
