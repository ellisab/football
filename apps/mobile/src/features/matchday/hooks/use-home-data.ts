import { useEffect, useState } from "react";
import { createHomeState, getHomeSnapshot } from "@footballleagues/core/home";
import type { LeagueKey } from "@footballleagues/core/leagues";
import {
  createMobileHomeViewModel,
  type MobileHomeViewModel,
} from "../../home/presenter/home-view-model";

type HomeDataState = {
  data: MobileHomeViewModel | null;
  loading: boolean;
  error: string;
};

export function useHomeData(activeLeague: LeagueKey, season: number) {
  const [state, setState] = useState<HomeDataState>({
    data: null,
    loading: true,
    error: "",
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: "",
      }));

      try {
        const snapshot = await getHomeSnapshot(
          { league: activeLeague, season: String(season) },
          { fallbackYear: season }
        );
        const state = createHomeState(snapshot);
        const data = createMobileHomeViewModel(state);

        if (!isMounted) return;

        setState({
          data,
          loading: false,
          error: data.visibleErrors.length > 0 ? "Some data failed to load. Pull to refresh." : "",
        });
      } catch {
        if (!isMounted) return;

        setState({
          data: null,
          loading: false,
          error: "Failed to load matches. Pull to refresh.",
        });
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [activeLeague, season]);

  return state;
}
