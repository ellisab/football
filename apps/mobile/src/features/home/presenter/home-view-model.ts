import {
  createHomeViewModel,
  type HomeState,
  type HomeViewModel,
  type HomeViewModelRoundSection,
  type HomeViewModelSection,
  type HomeViewModelTableSection,
} from "@footballleagues/core/home";

export type MobileHomeRoundSection = HomeViewModelRoundSection;
export type MobileHomeTableSection = HomeViewModelTableSection;
export type MobileHomeSection = HomeViewModelSection;
export type MobileHomeViewModel = HomeViewModel;

export const createMobileHomeViewModel = (state: HomeState): MobileHomeViewModel => {
  return createHomeViewModel(state, {
    getRoundSubtitle: ({ state, isNextRound }) => {
      const seasonSubtitle = `Saison ${state.resolvedSeason}`;

      return isNextRound ? `${seasonSubtitle} · kommende Spiele` : seasonSubtitle;
    },
  });
};
