import { Text, View } from "react-native";
import { groupKnockoutMatchesByTie, localizeGroupName } from "@footballleagues/core/matches";
import type { BracketRound } from "@footballleagues/core/home";
import type { AppStyles } from "../../../app/theme/styles";
import { TieCard } from "./tie-card";

export function BracketSection({
  rounds,
  styles,
}: {
  rounds: BracketRound[];
  styles: AppStyles;
}) {
  if (rounds.length === 0) return null;

  return (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionKicker}>K.-o.-Phase</Text>
        <Text style={styles.sectionTitle}>Champions-League-Baum</Text>
        <Text style={styles.sectionSubtitle}>
          K.-o.-Runden auf Basis der neuesten Gruppendaten.
        </Text>
      </View>
      <View style={styles.bracketCard}>
        {rounds.map((round) => {
          const ties = groupKnockoutMatchesByTie(round.matches);

          return (
            <View key={round.group.groupID ?? round.group.groupName}>
              <View style={styles.section}>
                <Text style={styles.roundTitle}>
                  {localizeGroupName(round.group.groupName) || "Runde"}
                </Text>
              </View>
              {ties.length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.emptyText}>Noch keine Spiele verfügbar.</Text>
                </View>
              ) : (
                ties.map((tie) => <TieCard key={tie.key} tie={tie} styles={styles} />)
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
