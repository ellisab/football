import { createHomeState, getHomeSnapshot } from "@footballleagues/core/home";
import { getWorldCupSnapshot } from "@footballleagues/core/world-cup";
import { createWebHomeViewModel } from "../presenter/home-view-model";

const REVALIDATE = { next: { revalidate: 60 } };
const NO_STORE = { cache: "no-store" as const };

export const getHomePageData = async (params: {
  group?: string;
  league?: string;
  season?: string;
}) => {
  const snapshot = await getHomeSnapshot(params, { requestOptions: REVALIDATE });
  const state = createHomeState(snapshot);
  const worldCup =
    state.resolvedLeague === "wc"
      ? await getWorldCupSnapshot({
          season: state.resolvedSeason,
          requestOptions: NO_STORE,
        })
      : undefined;

  return {
    ...createWebHomeViewModel(state),
    worldCup,
    worldCupGroup: params.group,
  };
};
