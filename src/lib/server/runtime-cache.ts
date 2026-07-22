import { getCache, type RuntimeCache } from "@vercel/functions";

let footballRuntimeCache: RuntimeCache | undefined;

export const getFootballRuntimeCache = () => {
  footballRuntimeCache ??= getCache({
    namespace: "football-data-v1",
    namespaceSeparator: ":",
  });

  return footballRuntimeCache;
};
