import { Text, View } from "react-native";
import type { KnockoutTie } from "@footballleagues/core/matches";
import type { AppStyles } from "../../../app/theme/styles";
import { MatchCard } from "../../matchday/components/match-card";

export function TieCard({
  tie,
  styles,
}: {
  tie: KnockoutTie;
  styles: AppStyles;
}) {
  const winnerRowStyle = {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 124, 167, 0.3)",
    backgroundColor: "rgba(91, 24, 46, 0.72)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start" as const,
  };
  const winnerTextStyle = {
    color: "#ffe2ee",
  };
  const hasLiveLeg = tie.matches.some((match) => match.matchIsFinished !== true);

  return (
    <View>
      <View style={styles.section}>
        <View style={tie.aggregateScore?.leader === "team1" ? winnerRowStyle : undefined}>
          <Text
            style={[
              styles.roundTitle,
              tie.aggregateScore?.leader === "team1" && winnerTextStyle,
            ]}
          >
            {tie.team1.teamName ?? "Team 1"}
          </Text>
        </View>
        <View style={tie.aggregateScore?.leader === "team2" ? winnerRowStyle : undefined}>
          <Text
            style={[
              styles.roundTitle,
              tie.aggregateScore?.leader === "team2" && winnerTextStyle,
            ]}
          >
            {tie.team2.teamName ?? "Team 2"}
          </Text>
        </View>
        {tie.aggregateScore ? (
          <Text style={styles.sectionSubtitle}>
            {hasLiveLeg ? "Live-Gesamtstand" : "Gesamtstand"} {tie.aggregateScore.team1} -{" "}
            {tie.aggregateScore.team2}
          </Text>
        ) : null}
      </View>

      {tie.matches.map((match, index) => (
        <View key={match.matchID ?? `${tie.key}-${index}`}>
          {tie.matches.length > 1 ? (
            <View style={styles.section}>
              <Text style={styles.sectionKicker}>Spiel {index + 1}</Text>
            </View>
          ) : null}
          <MatchCard match={match} styles={styles} />
        </View>
      ))}
    </View>
  );
}
