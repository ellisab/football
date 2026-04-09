import {
  createHomeViewModel,
  type HomeState,
  type HomeViewModel,
  type HomeViewModelRoundSection,
  type HomeViewModelSection,
  type HomeViewModelTableSection,
} from "@footballleagues/core/home";

export type WebHomeRoundSection = HomeViewModelRoundSection;
export type WebHomeTableSection = HomeViewModelTableSection;
export type WebHomeSection = HomeViewModelSection;
export type WebHomeViewModel = HomeViewModel;

export const createWebHomeViewModel = (state: HomeState): WebHomeViewModel => {
  return createHomeViewModel(state, {
    getRoundSubtitle: ({ state, leagueLabel }) =>
      `${leagueLabel} · Saison ${state.resolvedSeason}`,
  });
};
