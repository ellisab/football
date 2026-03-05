import { createHomeState, getHomeSnapshot } from "@footballleagues/core/home";
import { createWebHomeViewModel } from "../presenter/home-view-model";

const REVALIDATE = { next: { revalidate: 60 } };

export const getHomePageData = async (params: {
  league?: string;
  season?: string;
}) => {
  const snapshot = await getHomeSnapshot(params, { fetchOptions: REVALIDATE });
  const state = createHomeState(snapshot);

  return createWebHomeViewModel(state);
};
