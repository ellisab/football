import type { MobileHomeSection } from "./home-view-model";

export type QuickActionTarget = MobileHomeSection["key"] | "bracket";

const findSectionTarget = (
  sections: MobileHomeSection[],
  target: MobileHomeSection["key"]
) => sections.some((section) => section.key === target) ? target : null;

export const getPrimaryQuickActionTarget = ({
  sections,
  hasBracket,
}: {
  sections: MobileHomeSection[];
  hasBracket: boolean;
}): QuickActionTarget | null =>
  findSectionTarget(sections, "matchday") ??
  (hasBracket ? "bracket" : null) ??
  findSectionTarget(sections, "next-round") ??
  findSectionTarget(sections, "table");

export const getSecondaryQuickActionTarget = ({
  sections,
  hasTable,
  hasBracket,
}: {
  sections: MobileHomeSection[];
  hasTable: boolean;
  hasBracket: boolean;
}): QuickActionTarget | null => {
  if (hasTable) {
    const tableTarget = findSectionTarget(sections, "table");

    if (tableTarget) {
      return tableTarget;
    }
  }

  return (
    findSectionTarget(sections, "next-round") ??
    getPrimaryQuickActionTarget({ sections, hasBracket })
  );
};
