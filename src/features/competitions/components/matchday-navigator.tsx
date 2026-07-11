import Link from "next/link";
import type { ApiGroup } from "@footballleagues/core/openligadb";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

const getGroupLabel = (group: ApiGroup) =>
  group.groupName?.trim() ||
  (group.groupOrderID ? `${group.groupOrderID}. Spieltag` : "Runde");

const buildHref = ({
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

export function MatchdayNavigator({
  currentMatchday,
  groups,
  season,
  selectedMatchday,
  slug,
  scope = "all",
  view,
}: {
  currentMatchday?: number;
  groups: ApiGroup[];
  season: number;
  selectedMatchday?: number;
  slug: string;
  scope?: "all" | "fixtures" | "results";
  view: "matches" | "standings";
}) {
  const ordered = [...groups]
    .filter((group) => typeof group.groupOrderID === "number")
    .sort((a, b) => (a.groupOrderID ?? 0) - (b.groupOrderID ?? 0));
  const selectedIndex = ordered.findIndex(
    (group) => group.groupOrderID === selectedMatchday
  );
  const previous = selectedIndex > 0 ? ordered[selectedIndex - 1] : undefined;
  const next =
    selectedIndex >= 0 && selectedIndex < ordered.length - 1
      ? ordered[selectedIndex + 1]
      : undefined;

  if (view === "standings") return null;

  return (
    <div className="matchday-navigator">
      {previous?.groupOrderID ? (
        <Link
          href={buildHref({
            matchday: previous.groupOrderID,
            season,
            slug,
            view,
            scope,
          })}
          className="icon-button"
          aria-label={`Vorherige Runde: ${getGroupLabel(previous)}`}
        >
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        </Link>
      ) : (
        <span className="icon-button" aria-hidden="true" data-disabled="true">
          <ChevronLeft className="h-5 w-5" />
        </span>
      )}

      <form className="matchday-select-form" method="get">
        <input type="hidden" name="season" value={season} />
        <input type="hidden" name="view" value={view} />
        {scope !== "all" ? <input type="hidden" name="scope" value={scope} /> : null}
        <label htmlFor="matchday" className="sr-only">
          Spieltag oder Runde
        </label>
        <select
          id="matchday"
          name="matchday"
          defaultValue={selectedMatchday ? String(selectedMatchday) : ""}
          className="select-control"
        >
          {ordered.length === 0 ? <option value="">Aktuelle Runde</option> : null}
          {ordered.map((group) => (
            <option key={group.groupOrderID} value={group.groupOrderID}>
              {getGroupLabel(group)}
            </option>
          ))}
        </select>
        <button type="submit" className="button-secondary">
          Anzeigen
        </button>
      </form>

      {currentMatchday && currentMatchday !== selectedMatchday ? (
        <Link
          href={buildHref({ matchday: currentMatchday, season, slug, view, scope })}
          className="matchday-current-link"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Aktuell
        </Link>
      ) : null}

      {next?.groupOrderID ? (
        <Link
          href={buildHref({
            matchday: next.groupOrderID,
            season,
            slug,
            view,
            scope,
          })}
          className="icon-button"
          aria-label={`Nächste Runde: ${getGroupLabel(next)}`}
        >
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </Link>
      ) : (
        <span className="icon-button" aria-hidden="true" data-disabled="true">
          <ChevronRight className="h-5 w-5" />
        </span>
      )}
    </div>
  );
}
