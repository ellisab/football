import type { KnockoutTie } from "../../matches";
import type { LeagueKey, LeagueOption } from "../../leagues";
import type { ApiMatch, ApiTableRow } from "../../openligadb";
import type {
  BracketRound,
  HomeErrorKey,
  HomeRoundSnapshot,
} from "../types";

export type HomeMatchSectionState = {
  key: "next-round" | "matchday";
  round: HomeRoundSnapshot;
  renderKind: "matches";
  items: ApiMatch[];
};

export type HomeTieSectionState = {
  key: "next-round" | "matchday";
  round: HomeRoundSnapshot;
  renderKind: "ties";
  items: KnockoutTie[];
};

export type HomeTableSectionState = {
  key: "table";
  renderKind: "table";
  items: ApiTableRow[];
};

export type HomeRoundSectionState = HomeMatchSectionState | HomeTieSectionState;
export type HomeSectionState = HomeRoundSectionState | HomeTableSectionState;

export type HomeState = {
  resolvedLeague: LeagueKey;
  resolvedSeason: number;
  leagueOptions: LeagueOption[];
  currentRound: HomeRoundSnapshot;
  nextRound: HomeRoundSnapshot;
  hasTable: boolean;
  bracketMatches: BracketRound[];
  table: ApiTableRow[];
  errorKeys: HomeErrorKey[];
  usesKnockoutLabels: boolean;
  isChampionsLeaguePlayoffRound: boolean;
  sections: HomeSectionState[];
};
