import { createHomeState, getHomeSnapshot } from "@footballleagues/core/home";
import { getWorldCupSnapshot } from "@footballleagues/core/world-cup";
import { unstable_cache } from "next/cache";
import { createWebHomeViewModel } from "../presenter/home-view-model";

const REVALIDATE_SECONDS = 60;
const REVALIDATE = { next: { revalidate: REVALIDATE_SECONDS } };
const getCachedWorldCupSnapshot = unstable_cache(
  async (season: number) =>
    getWorldCupSnapshot({
      season,
      requestOptions: REVALIDATE,
    }),
  ["world-cup-snapshot"],
  { revalidate: REVALIDATE_SECONDS }
);

export const getHomePageData = async (params: {
  group?: string;
  league?: string;
  season?: string;
}) => {
  const snapshot = await getHomeSnapshot(params, { requestOptions: REVALIDATE });
  const state = createHomeState(snapshot);
  const worldCup =
    state.resolvedLeague === "wc"
      ? await getCachedWorldCupSnapshot(state.resolvedSeason)
      : undefined;

  return {
    ...createWebHomeViewModel(state),
    worldCup,
    worldCupGroup: params.group,
  };
};
