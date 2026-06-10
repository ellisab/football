import {
  createHomeViewModel,
  type HomeState,
  type HomeViewModel,
  type HomeViewModelRoundSection,
  type HomeViewModelSection,
  type HomeViewModelTableSection,
} from "@footballleagues/core/home";
import type { WorldCupSnapshot } from "@footballleagues/core/world-cup";

export type WebHomeRoundSection = HomeViewModelRoundSection;
export type WebHomeTableSection = HomeViewModelTableSection;
export type WebHomeSection = HomeViewModelSection;
export type WebHomeViewModel = HomeViewModel & {
  worldCup?: WorldCupSnapshot;
};

export const createWebHomeViewModel = (state: HomeState): WebHomeViewModel => {
  return createHomeViewModel(state, {
    getRoundSubtitle: ({ state, leagueLabel }) =>
      `${leagueLabel} · Saison ${state.resolvedSeason}`,
  });
};
