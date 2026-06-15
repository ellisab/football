import type { ApiMatch } from "@footballleagues/core/openligadb";
import { sortMatchesByUpcomingFirst } from "@footballleagues/core/matches";
import type { WebHomeRoundSection } from "../presenter/home-view-model";
import { TieCardList } from "@/features/champions-league/components/tie-card-list";
import { MatchCard } from "@/features/matchday/components/match-card";
import { SectionHeading } from "./section-heading";

const getMatchKey = (match: ApiMatch, index: number) => {
  return (
    match.matchID ?? `${match.team1?.teamId ?? "home"}-${match.team2?.teamId ?? "away"}-${index}`
  );
};

export function RoundSection({
  sectionId,
  section,
}: {
  sectionId?: string;
  section: WebHomeRoundSection;
}) {
  const matches =
    section.renderKind === "matches"
      ? sortMatchesByUpcomingFirst(section.items)
      : [];

  return (
    <section
      id={sectionId ?? section.key}
      className="grid scroll-mt-40 gap-3 sm:scroll-mt-44"
    >
      <SectionHeading
        kicker={section.kicker}
        title={section.title}
        subtitle={section.subtitle}
      />
      <div className="grid gap-4">
        {section.items.length === 0 ? (
          <div className="poster-empty rounded-[1.6rem] p-5 text-[#a9c0b6]">
            {section.emptyText}
          </div>
        ) : section.renderKind === "ties" ? (
          <TieCardList
            ties={section.items}
            keyPrefix={section.key}
            emptyText={section.emptyText}
          />
        ) : (
          matches.map((match, index) => (
            <MatchCard key={getMatchKey(match, index)} match={match} />
          ))
        )}
      </div>
    </section>
  );
}
