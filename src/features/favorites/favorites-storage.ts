import { isLeagueKey } from "@footballleagues/core/leagues";

export const FAVORITES_STORAGE_KEY = "spieltag:favorites";
export const FAVORITES_STORAGE_VERSION = 2 as const;

export type FavoriteKind = "competition" | "team";

export type FavoritesSnapshot = Readonly<{
  competitionIds: readonly string[];
  teamIds: readonly string[];
}>;

type StoredFavorites = {
  version: typeof FAVORITES_STORAGE_VERSION;
  competitionIds: string[];
  teamIds: string[];
};

const MAX_FAVORITES_PER_KIND = 250;
const MAX_FAVORITE_ID_LENGTH = 128;

export const EMPTY_FAVORITES: FavoritesSnapshot = Object.freeze({
  competitionIds: Object.freeze([] as string[]),
  teamIds: Object.freeze([] as string[]),
});

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
};

export const normalizeFavoriteId = (value: unknown): string | undefined => {
  if (typeof value !== "string" && typeof value !== "number") return undefined;

  const normalized = String(value).trim();
  if (!normalized || normalized.length > MAX_FAVORITE_ID_LENGTH)
    return undefined;

  return normalized;
};

const normalizeIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  const ids: string[] = [];
  const seen = new Set<string>();

  for (const candidate of value) {
    const id = normalizeFavoriteId(candidate);
    if (!id || seen.has(id)) continue;

    seen.add(id);
    ids.push(id);
    if (ids.length === MAX_FAVORITES_PER_KIND) break;
  }

  return ids;
};

const normalizeCompetitionIds = (value: unknown): string[] => {
  return normalizeIds(value).filter(isLeagueKey);
};

const getTypedLegacyIds = (value: unknown, kind: FavoriteKind): string[] => {
  if (!Array.isArray(value)) return [];

  return normalizeIds(
    value.flatMap((candidate) => {
      const record = asRecord(candidate);
      return record?.kind === kind ? [record.id] : [];
    }),
  );
};

const getFirstKnownIds = (
  record: Record<string, unknown>,
  keys: readonly string[],
): string[] | undefined => {
  for (const key of keys) {
    if (Array.isArray(record[key])) return normalizeIds(record[key]);
  }

  return undefined;
};

const createFavoritesSnapshot = ({
  competitionIds = [],
  teamIds = [],
}: Partial<FavoritesSnapshot> = {}): FavoritesSnapshot => {
  return Object.freeze({
    competitionIds: Object.freeze(normalizeCompetitionIds(competitionIds)),
    teamIds: Object.freeze(normalizeIds(teamIds)),
  });
};

export const parseFavoritesValue = (value: unknown): FavoritesSnapshot => {
  const record = asRecord(value);
  if (!record) return EMPTY_FAVORITES;

  if (
    typeof record.version === "number" &&
    record.version > FAVORITES_STORAGE_VERSION
  ) {
    return EMPTY_FAVORITES;
  }

  const typedCompetitionIds = getTypedLegacyIds(
    record.favorites,
    "competition",
  );
  const typedTeamIds = getTypedLegacyIds(record.favorites, "team");

  return createFavoritesSnapshot({
    competitionIds:
      getFirstKnownIds(record, [
        "competitionIds",
        "competitions",
        "leagueIds",
      ]) ?? typedCompetitionIds,
    teamIds: getFirstKnownIds(record, ["teamIds", "teams"]) ?? typedTeamIds,
  });
};

export const parseFavoritesStorage = (
  raw: string | null,
): FavoritesSnapshot => {
  if (!raw) return EMPTY_FAVORITES;

  try {
    return parseFavoritesValue(JSON.parse(raw));
  } catch {
    return EMPTY_FAVORITES;
  }
};

export const serializeFavorites = (snapshot: FavoritesSnapshot): string => {
  const payload: StoredFavorites = {
    version: FAVORITES_STORAGE_VERSION,
    competitionIds: normalizeCompetitionIds(snapshot.competitionIds),
    teamIds: normalizeIds(snapshot.teamIds),
  };

  return JSON.stringify(payload);
};

export const isFavorite = (
  snapshot: FavoritesSnapshot,
  kind: FavoriteKind,
  id: unknown,
): boolean => {
  const normalizedId = normalizeFavoriteId(id);
  if (!normalizedId || (kind === "competition" && !isLeagueKey(normalizedId))) {
    return false;
  }

  const ids =
    kind === "competition" ? snapshot.competitionIds : snapshot.teamIds;
  return ids.includes(normalizedId);
};

export const updateFavorite = (
  snapshot: FavoritesSnapshot,
  kind: FavoriteKind,
  id: unknown,
  selected: boolean,
): FavoritesSnapshot => {
  const normalizedId = normalizeFavoriteId(id);
  if (
    !normalizedId ||
    (kind === "competition" && !isLeagueKey(normalizedId)) ||
    isFavorite(snapshot, kind, normalizedId) === selected
  ) {
    return snapshot;
  }

  const key = kind === "competition" ? "competitionIds" : "teamIds";
  const currentIds = snapshot[key];
  const nextIds = selected
    ? [...currentIds, normalizedId]
    : currentIds.filter((candidate) => candidate !== normalizedId);

  return createFavoritesSnapshot({
    ...snapshot,
    [key]: nextIds,
  });
};
