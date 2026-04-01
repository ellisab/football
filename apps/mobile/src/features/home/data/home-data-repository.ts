import {
  createHomeState,
  getHomeSnapshot,
  type HomeSnapshot,
} from "@footballleagues/core/home";
import type { LeagueKey } from "@footballleagues/core/leagues";
import {
  createMobileHomeViewModel,
  type MobileHomeViewModel,
} from "../presenter/home-view-model";
import { buildWebAppUrl } from "../../../app/config/web-base-url";

const RETRY_DELAYS_MS = [150, 400];

const isAbortError = (error: unknown) => {
  return error instanceof Error && error.name === "AbortError";
};

const getPartialErrorMessage = (data: MobileHomeViewModel) => {
  return data.visibleErrors.length > 0
    ? "Einige Daten konnten nicht geladen werden. Zum Aktualisieren nach unten ziehen."
    : "";
};

const fetchRemoteSnapshot = async ({
  league,
  season,
  signal,
}: {
  league: LeagueKey;
  season: number;
  signal?: AbortSignal;
}): Promise<HomeSnapshot | null> => {
  const url = buildWebAppUrl("/api/home", {
    league,
    season,
  });

  if (!url) {
    return null;
  }

  const response = await fetch(url, {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Home API request failed (${response.status})`);
  }

  return response.json() as Promise<HomeSnapshot>;
};

const loadSnapshot = async ({
  league,
  season,
  signal,
}: {
  league: LeagueKey;
  season: number;
  signal?: AbortSignal;
}) => {
  const remoteSnapshot = await fetchRemoteSnapshot({ league, season, signal });

  if (remoteSnapshot) {
    return remoteSnapshot;
  }

  return getHomeSnapshot(
    { league, season: String(season) },
    {
      fallbackYear: season,
      requestOptions: signal ? { signal } : undefined,
    }
  );
};

const wait = async (delayMs: number, signal?: AbortSignal) => {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, delayMs);

    if (!signal) {
      return;
    }

    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        const abortError = new Error("Request aborted");
        abortError.name = "AbortError";
        reject(abortError);
      },
      { once: true }
    );
  });
};

export const loadHomeData = async ({
  league,
  season,
  signal,
}: {
  league: LeagueKey;
  season: number;
  signal?: AbortSignal;
}) => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const snapshot = await loadSnapshot({ league, season, signal });
      const state = createHomeState(snapshot);
      const data = createMobileHomeViewModel(state);

      return {
        data,
        error: getPartialErrorMessage(data),
      };
    } catch (error) {
      lastError = error;

      if (isAbortError(error)) {
        throw error;
      }

      if (attempt === RETRY_DELAYS_MS.length) {
        break;
      }

      await wait(RETRY_DELAYS_MS[attempt] as number, signal);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Home data could not be loaded");
};
