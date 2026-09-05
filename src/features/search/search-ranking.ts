export type SearchResultKind = "competition" | "match" | "matchday" | "team";

export type SearchResultItem = {
  aliases?: readonly string[];
  description?: string;
  href: string;
  id: string;
  keywords?: readonly string[];
  kind: SearchResultKind;
  label: string;
};

export type RankedSearchResult = {
  item: SearchResultItem;
  score: number;
};

export type SearchRankingOptions = {
  kinds?: readonly SearchResultKind[];
  limit?: number;
};

type SearchCandidate = {
  value: string;
  tokens: string[];
  weight: number;
};

export type SearchIndex = readonly {
  item: SearchResultItem;
  index: number;
  candidates: SearchCandidate[];
}[];

const CHARACTER_FOLDS: Record<string, string> = {
  æ: "ae",
  đ: "d",
  ð: "d",
  ł: "l",
  ø: "o",
  œ: "oe",
  ß: "ss",
  þ: "th",
};

export const normalizeSearchText = (value: string): string => {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(
      /[æđðłøœßþ]/g,
      (character) => CHARACTER_FOLDS[character] ?? character,
    )
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
};

const getMaximumFuzzyDistance = (length: number) => {
  if (length <= 4) return 1;
  if (length <= 8) return 2;
  return 3;
};

const getEditDistance = (left: string, right: string, maximum: number) => {
  if (Math.abs(left.length - right.length) > maximum) return maximum + 1;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    let rowMinimum = current[0] ?? leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      const value = Math.min(
        (current[rightIndex - 1] ?? maximum) + 1,
        (previous[rightIndex] ?? maximum) + 1,
        (previous[rightIndex - 1] ?? maximum) + substitutionCost,
      );

      current[rightIndex] = value;
      rowMinimum = Math.min(rowMinimum, value);
    }

    if (rowMinimum > maximum) return maximum + 1;
    previous = current;
  }

  return previous[right.length] ?? maximum + 1;
};

const scoreNormalizedCandidate = (
  { value: candidate, tokens: candidateTokens }: SearchCandidate,
  normalizedQuery: string,
  queryTokens: string[],
): number => {
  if (!candidate) return 0;
  if (candidate === normalizedQuery) return 1_200;
  if (candidate.startsWith(normalizedQuery)) {
    return 1_000 - Math.min(candidate.length - normalizedQuery.length, 120);
  }

  const substringIndex = candidate.indexOf(normalizedQuery);
  if (substringIndex >= 0) return 820 - Math.min(substringIndex * 3, 180);

  const allExact = queryTokens.every((queryToken) =>
    candidateTokens.includes(queryToken),
  );
  if (allExact) return 760;

  const allPrefix = queryTokens.every((queryToken) =>
    candidateTokens.some((candidateToken) =>
      candidateToken.startsWith(queryToken),
    ),
  );
  if (allPrefix) return 680;

  let fuzzyDistance = 0;
  for (const queryToken of queryTokens) {
    const maximum = getMaximumFuzzyDistance(queryToken.length);
    const closest = candidateTokens.reduce(
      (best, candidateToken) =>
        Math.min(best, getEditDistance(queryToken, candidateToken, maximum)),
      maximum + 1,
    );

    if (closest > maximum) return 0;
    fuzzyDistance += closest;
  }

  return Math.max(220, 520 - fuzzyDistance * 70);
};

const prepareCandidates = (item: SearchResultItem): SearchCandidate[] =>
  [
    { value: item.label, weight: 1 },
    ...(item.aliases ?? []).map((value) => ({ value, weight: 0.9 })),
    ...(item.keywords ?? []).map((value) => ({ value, weight: 0.78 })),
    ...(item.description ? [{ value: item.description, weight: 0.62 }] : []),
  ].map(({ value, weight }) => {
    const normalized = normalizeSearchText(value);
    return { value: normalized, tokens: normalized.split(" "), weight };
  });

export const createSearchIndex = (
  items: readonly SearchResultItem[],
): SearchIndex =>
  items.map((item, index) => ({
    item,
    index,
    candidates: prepareCandidates(item),
  }));

const scoreCandidates = (
  candidates: SearchCandidate[],
  normalizedQuery: string,
  queryTokens: string[],
): number =>
  Math.round(
    candidates.reduce(
      (best, candidate) =>
        Math.max(
          best,
          scoreNormalizedCandidate(candidate, normalizedQuery, queryTokens) *
            candidate.weight,
        ),
      0,
    ),
  );

export const scoreSearchItem = (
  item: SearchResultItem,
  query: string,
): number => {
  const normalizedQuery = normalizeSearchText(query);
  return normalizedQuery
    ? scoreCandidates(
        prepareCandidates(item),
        normalizedQuery,
        normalizedQuery.split(" "),
      )
    : 0;
};

export const rankSearchIndex = (
  searchIndex: SearchIndex,
  query: string,
  { kinds, limit = 12 }: SearchRankingOptions = {},
): RankedSearchResult[] => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery || limit <= 0) return [];

  const queryTokens = normalizedQuery.split(" ");
  const allowedKinds = kinds ? new Set(kinds) : undefined;

  return searchIndex
    .filter(({ item }) => !allowedKinds || allowedKinds.has(item.kind))
    .map(({ item, index, candidates }) => ({
      item,
      index,
      score: scoreCandidates(candidates, normalizedQuery, queryTokens),
    }))
    .filter((result) => result.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.item.label.localeCompare(right.item.label, "de") ||
        left.index - right.index,
    )
    .slice(0, limit)
    .map(({ item, score }) => ({ item, score }));
};

export const rankSearchResults = (
  items: readonly SearchResultItem[],
  query: string,
  options: SearchRankingOptions = {},
): RankedSearchResult[] => {
  if (!query.trim() || (options.limit !== undefined && options.limit <= 0))
    return [];
  return rankSearchIndex(createSearchIndex(items), query, options);
};
