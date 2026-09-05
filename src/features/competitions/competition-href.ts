export const buildCompetitionHref = ({
  matchday,
  season,
  slug,
  scope,
  view,
}: {
  matchday?: number;
  season: number;
  slug: string;
  scope?: "all" | "fixtures" | "results";
  view: "matches" | "standings";
}) => {
  const query = new URLSearchParams({ season: String(season), view });
  if (scope && scope !== "all") query.set("scope", scope);
  if (matchday) query.set("matchday", String(matchday));
  return `/competitions/${slug}?${query.toString()}`;
};
