import {
  createHomeViewModel,
  type HomeState,
  type HomeViewModel,
} from "@footballleagues/core/home";

export type WebCompetitionViewModel = HomeViewModel;
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
