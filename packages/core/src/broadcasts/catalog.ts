import type { Broadcaster, BroadcasterId, MatchBroadcast } from "./types";
import { BROADCASTER_ORDER } from "./types";

type BroadcasterProfile = Omit<Broadcaster, "id">;

const BROADCASTER_PROFILES: Record<BroadcasterId, BroadcasterProfile> = {
  sat1: {
    access: "free",
    medium: "tv",
    name: "SAT.1",
    ownership: "private",
    shortName: "SAT.1",
  },
  "rtl-nitro": {
    access: "free",
    medium: "tv",
    name: "RTL oder NITRO",
    ownership: "private",
    shortName: "RTL/NITRO",
  },
  rtl: {
    access: "free",
    medium: "tv",
    name: "RTL",
    ownership: "private",
    shortName: "RTL",
  },
  nitro: {
    access: "free",
    medium: "tv",
    name: "NITRO",
    ownership: "private",
    shortName: "NITRO",
  },
  sky: {
    access: "subscription",
    medium: "tv",
    name: "Sky Sport Bundesliga",
    ownership: "private",
    shortName: "sky",
  },
  wow: {
    access: "subscription",
    medium: "stream",
    name: "WOW",
    ownership: "private",
    shortName: "WOW",
  },
  "rtl-plus": {
    access: "subscription",
    medium: "stream",
    name: "RTL+",
    ownership: "private",
    shortName: "RTL+",
  },
  "prime-video": {
    access: "subscription",
    medium: "stream",
    name: "Prime Video",
    ownership: "private",
    shortName: "prime",
  },
  dazn: {
    access: "subscription",
    medium: "stream",
    name: "DAZN",
    ownership: "private",
    shortName: "DAZN",
  },
};

export const BROADCASTER_CATALOG = Object.fromEntries(
  BROADCASTER_ORDER.map((id) => [
    id,
    {
      ...BROADCASTER_PROFILES[id],
      id,
    },
  ]),
) as Record<BroadcasterId, Broadcaster>;

export const isBroadcasterId = (value: unknown): value is BroadcasterId => {
  return typeof value === "string" && Object.hasOwn(BROADCASTER_CATALOG, value);
};

export const sortMatchBroadcasts = (
  broadcasts: readonly MatchBroadcast[],
): MatchBroadcast[] => {
  return [...broadcasts].sort((left, right) => {
    const leftIndex = BROADCASTER_ORDER.indexOf(left.id);
    const rightIndex = BROADCASTER_ORDER.indexOf(right.id);
    const byBroadcaster = leftIndex - rightIndex;
    if (byBroadcaster !== 0) return byBroadcaster;

    return left.coverage === right.coverage
      ? 0
      : left.coverage === "individual"
        ? -1
        : 1;
  });
};
