import type { ApiMatch } from "./types";

export const getFinalResult = (match: ApiMatch) => {
  if (!match.matchResults || match.matchResults.length === 0) {
    return undefined;
  }

  const orderedResults = match.matchResults.filter(
    (result) => typeof result.resultOrderID === "number",
  );

  if (orderedResults.length > 0) {
    return [...orderedResults].sort(
      (a, b) => (b.resultOrderID ?? 0) - (a.resultOrderID ?? 0),
    )[0];
  }

  return (
    match.matchResults.find((result) => result.resultTypeID === 2) ??
    match.matchResults[match.matchResults.length - 1]
  );
};
