import {
  createHomeViewModel,
  type HomeState,
  type HomeViewModel,
  type HomeViewModelRoundSection,
  type HomeViewModelSection,
} from "@footballleagues/core/home";
import type { WorldCupSnapshot } from "@footballleagues/core/world-cup";

export type WebHomeRoundSection = HomeViewModelRoundSection;
export type WebHomeSection = HomeViewModelSection;
export type WebCompetitionViewModel = HomeViewModel & {
  worldCup?: WorldCupSnapshot;
};
export type WebHomeViewModel = WebCompetitionViewModel & {
  competitions?: WebCompetitionViewModel[];
  isOverview?: boolean;
};

export const createWebHomeViewModel = (state: HomeState): WebHomeViewModel => {
  return createHomeViewModel(state, {
    getRoundSubtitle: ({ state, leagueLabel }) =>
      `${leagueLabel} · Saison ${state.resolvedSeason}`,
  });
};
