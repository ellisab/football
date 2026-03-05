import { Text, View } from "react-native";
import { groupKnockoutMatchesByTie } from "@footballleagues/core/matches";
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
        <Text style={styles.sectionKicker}>Knockout</Text>
        <Text style={styles.sectionTitle}>Champions League Bracket</Text>
        <Text style={styles.sectionSubtitle}>
          Knockout rounds based on the latest groups data.
        </Text>
      </View>
      <View style={styles.bracketCard}>
        {rounds.map((round) => {
          const ties = groupKnockoutMatchesByTie(round.matches);

          return (
            <View key={round.group.groupID ?? round.group.groupName}>
              <View style={styles.section}>
                <Text style={styles.roundTitle}>{round.group.groupName ?? "Round"}</Text>
              </View>
              {ties.length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.emptyText}>No matches available yet.</Text>
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
