import type { ReactElement, RefObject } from "react";
import { SectionList, Text, View } from "react-native";
import type { KnockoutTie } from "@footballleagues/core/matches";
import type { ApiMatch, ApiTableRow } from "@footballleagues/core/openligadb";
import type { AppStyles } from "../../../app/theme/styles";
import { TieCard } from "../../champions-league/components/tie-card";
import { MatchCard } from "../../matchday/components/match-card";
import { TableRow } from "../../standings/components/table-row";
import type { MobileHomeSection } from "../presenter/home-view-model";

type SectionItem = ApiMatch | ApiTableRow | KnockoutTie;
type SectionListSection = MobileHomeSection & {
  data: SectionItem[];
};
export type HomeSectionListRef = SectionList<SectionItem, SectionListSection>;

export function HomeSectionList({
  sections,
  styles,
  header,
  footer,
  listRef,
  onScrollToIndexFailed,
}: {
  sections: MobileHomeSection[];
  styles: AppStyles;
  header?: ReactElement | null;
  footer?: ReactElement | null;
  listRef?: RefObject<HomeSectionListRef | null>;
  onScrollToIndexFailed?: (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => void;
}) {
  const sectionData: SectionListSection[] = sections.map((section) => ({
    ...section,
    data: section.items as SectionItem[],
  }));

  const renderSectionHeader = ({ section }: { section: SectionListSection }) => (
    <View style={styles.section}>
      <View style={styles.sectionKickerRow}>
        <View style={styles.sectionKickerDot} />
        <Text style={styles.sectionKicker}>{section.kicker}</Text>
      </View>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.subtitle ? (
        <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
      ) : null}
      {section.data.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{section.emptyText}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderItem = ({
    item,
    index,
    section,
  }: {
    item: SectionItem;
    index: number;
    section: SectionListSection;
  }) => {
    if (section.renderKind === "matches") {
      return <MatchCard match={item as ApiMatch} styles={styles} />;
    }

    if (section.renderKind === "ties") {
      return <TieCard tie={item as KnockoutTie} styles={styles} />;
    }

    return (
      <TableRow
        row={item as ApiTableRow}
        index={index}
        total={section.data.length}
        styles={styles}
      />
    );
  };

  return (
    <SectionList<SectionItem, SectionListSection>
      ref={listRef}
      sections={sectionData}
      keyExtractor={(item, index) =>
        (item as KnockoutTie).key ||
        (item as ApiMatch).matchID?.toString?.() ||
        (item as ApiTableRow).teamInfoId?.toString?.() ||
        (item as ApiTableRow).teamName ||
        index.toString()
      }
      onScrollToIndexFailed={onScrollToIndexFailed}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
      initialNumToRender={6}
      windowSize={7}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
    />
  );
}
