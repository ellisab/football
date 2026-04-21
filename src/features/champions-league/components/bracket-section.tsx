import { Trophy } from "lucide-react";
import { groupKnockoutMatchesByTie, localizeGroupName } from "@footballleagues/core/matches";
import type { BracketRound } from "@footballleagues/core/home";
import { TieCardList } from "./tie-card-list";

type BracketSectionProps = {
  title: string;
  rounds: BracketRound[];
};

export function BracketSection({ title, rounds }: BracketSectionProps) {
  if (rounds.length === 0) return null;

  return (
    <section className="grid gap-5">
      <div className="grid gap-2">
        <h2 className="text-[1.85rem] leading-[0.9] font-[var(--font-stadium-heading)] uppercase text-[#f4efd6] sm:text-[2.2rem]">
          <span className="inline-flex items-center gap-2">
            <Trophy className="h-6 w-6 text-[#dcbc6e]" />
            {title}
          </span>
        </h2>
        <p className="text-sm leading-6 text-[#a9c0b6]">
          K.-o.-Runden auf Basis der neuesten Gruppendaten.
        </p>
      </div>

      {rounds.map(({ group, matches }) => {
        const ties = groupKnockoutMatchesByTie(matches);

        return (
          <div key={group.groupID ?? group.groupName} className="grid gap-3">
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#72d9e4]">
              {localizeGroupName(group.groupName) || "Runde"}
            </div>
            <TieCardList
              ties={ties}
              keyPrefix={`${group.groupID ?? group.groupName ?? "round"}`}
              emptyText="Noch keine Spiele verfügbar."
            />
          </div>
        );
      })}
    </section>
  );
}
