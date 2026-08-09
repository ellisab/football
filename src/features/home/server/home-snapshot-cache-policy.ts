import type { HomeSnapshot } from "@footballleagues/core/home";

const FIXTURE_CRITICAL_HOME_ERRORS = new Set<HomeSnapshot["errorKeys"][number]>(
  [
    "current group",
    "matchday",
    "groups",
    "playoffs",
    "next groups",
    "next matchday",
    "knockout rounds",
  ],
);

export class IncompleteSnapshotError extends Error {
  readonly errorKeys: readonly string[];
  readonly status?: number;

  constructor(errorKeys: readonly string[], status?: number) {
    super("Incomplete home snapshot");
    this.name = "IncompleteSnapshotError";
    this.errorKeys = errorKeys;
    this.status = status;
  }
}

export const requireCacheableHomeSnapshot = (snapshot: HomeSnapshot) => {
  const errorKeys = snapshot.errorKeys.filter((errorKey) =>
    FIXTURE_CRITICAL_HOME_ERRORS.has(errorKey),
  );

  if (errorKeys.length > 0 || snapshot.rateLimited) {
    throw new IncompleteSnapshotError(
      [...errorKeys, ...(snapshot.rateLimited ? ["rate limited"] : [])],
      snapshot.rateLimited ? 429 : undefined,
    );
  }

  return snapshot;
};
