import { useEffect, useState } from "react";
import type { LeagueKey } from "@footballleagues/core/leagues";
import type { MobileHomeViewModel } from "../presenter/home-view-model";
import { loadHomeData } from "../data/home-data-repository";

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
    const abortController = new AbortController();

    const load = async () => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: "",
      }));

      try {
        const result = await loadHomeData({
          league: activeLeague,
          season,
          signal: abortController.signal,
        });

        setState({
          data: result.data,
          loading: false,
          error: result.error,
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setState({
          data: null,
          loading: false,
          error: "Spiele konnten nicht geladen werden. Zum Aktualisieren nach unten ziehen.",
        });
      }
    };

    void load();

    return () => {
      abortController.abort();
    };
  }, [activeLeague, season]);

  return state;
}
