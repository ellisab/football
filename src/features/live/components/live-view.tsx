import type { WebHomeViewModel } from "@/features/home/presenter/home-view-model";
import type { CompetitionMatch } from "@/features/football/view-utils";
import { getCompetitionMeta } from "@/features/football/competition-meta";
import {
  DataNotice,
  PageIntro,
  PartialDataNotice,
} from "@/features/football/components/product-ui";
import { LiveRefreshController } from "./live-refresh-controller";
import type { LiveMatchItem } from "./live-polling";

const getSectionGroup = (
  competition: CompetitionMatch["competition"],
  matchId: number | undefined
) => {
  if (matchId === undefined) return undefined;

  for (const section of competition.sections) {
    if (section.renderKind === "table") continue;
    const matches =
      section.renderKind === "matches"
        ? section.items
        : section.items.flatMap((tie) => tie.matches);
    if (matches.some((match) => match.matchID === matchId)) {
      return section.groupOrderID;
    }
  }

  return competition.bracketMatches.find((round) =>
    round.matches.some((match) => match.matchID === matchId)
  )?.group.groupOrderID;
};

const toLiveMatchItem = ({
  competition,
  match,
}: CompetitionMatch): LiveMatchItem => {
  const meta = getCompetitionMeta(competition.resolvedLeague);
  const group =
    match.group?.groupOrderID ?? getSectionGroup(competition, match.matchID);

  return {
    competitionId: competition.resolvedLeague,
    competitionLabel: meta.label,
    match,
    roundLabel:
      match.group?.groupName ?? `Saison ${competition.resolvedSeason}`,
    scope:
      typeof group === "number" && group > 0
        ? {
            group,
            league: competition.resolvedLeague,
            season: competition.resolvedSeason,
          }
        : undefined,
  };
};

export function LiveView({
  data,
  matches,
}: {
  data: WebHomeViewModel;
  matches: CompetitionMatch[];
}) {
  return (
    <div className="page-shell match-feed-page live-page">
      <div className="content-column">
        <PageIntro
          eyebrow="Live-Zentrale"
          title="Jetzt im Spiel"
          description="Spielstände werden pro aktivem Spieltag gemeinsam aktualisiert. Live-Hinweise werden bewusst als Schätzung gekennzeichnet."
          actions={
            <span className="live-indicator">
              <span aria-hidden="true" />
              Datenstatus aktiv
            </span>
          }
        />

        <DataNotice>
          OpenLigaDB liefert weder einen bestätigten Live-Schalter noch die aktuelle
          Spielminute. „Läuft möglicherweise“ wird nur aus Anstoßzeit und fehlendem
          Endstatus abgeleitet.
        </DataNotice>
        <PartialDataNotice errors={data.visibleErrors} />
        <LiveRefreshController
          initialMatches={matches.map(toLiveMatchItem)}
        />
      </div>
    </div>
  );
}
