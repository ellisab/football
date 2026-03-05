import { Text, View } from "react-native";
import { formatKickoff } from "@footballleagues/core/matches";
import { getFinalResult, type ApiMatch } from "@footballleagues/core/openligadb";
import type { AppStyles } from "../../../app/theme/styles";
import { TeamBadge } from "../../teams/components/team-badge";

export function MatchCard({
  match,
  styles,
}: {
  match: ApiMatch;
  styles: AppStyles;
}) {
  const finalResult = getFinalResult(match);
  const goalEvents = Array.isArray(match.goals) ? match.goals : [];
  const score = finalResult
    ? `${finalResult.pointsTeam1 ?? 0} - ${finalResult.pointsTeam2 ?? 0}`
    : "- : -";

  return (
    <View
      key={match.matchID ?? `${match.team1?.teamId}-${match.team2?.teamId}`}
      style={styles.card}
    >
      <View style={styles.cardMetaRow}>
        <View style={styles.cardMetaChip}>
          <Text style={styles.cardMetaText}>
            {formatKickoff(match.matchDateTimeUTC || match.matchDateTime)}
          </Text>
        </View>
        <View
          style={[
            styles.cardMetaChip,
            match.matchIsFinished
              ? styles.cardMetaStatusFinal
              : styles.cardMetaStatusScheduled,
          ]}
        >
          <Text
            style={[
              styles.cardMetaText,
              match.matchIsFinished
                ? styles.cardMetaStatusFinalText
                : styles.cardMetaStatusScheduledText,
            ]}
          >
            {match.matchIsFinished ? "Final" : "Scheduled"}
          </Text>
        </View>
      </View>

      <View style={styles.teamRow}>
        <View style={styles.teamLabelRow}>
          <TeamBadge
            name={match.team1?.teamName}
            iconUrl={match.team1?.teamIconUrl}
            styles={styles}
          />
          <Text style={styles.team} numberOfLines={1}>
            {match.team1?.teamName || "Home"}
          </Text>
        </View>
        <Text style={styles.score}>{score}</Text>
      </View>

      <View style={[styles.teamLabelRow, styles.teamLabelRowSecondary]}>
        <TeamBadge
          name={match.team2?.teamName}
          iconUrl={match.team2?.teamIconUrl}
          styles={styles}
        />
        <Text style={styles.team} numberOfLines={1}>
          {match.team2?.teamName || "Away"}
        </Text>
      </View>

      {goalEvents.length > 0 ? (
        <View style={styles.goalList}>
          {goalEvents.map((goal, index) => (
            <Text
              key={goal.goalID ?? `${goal.goalGetterName}-${goal.matchMinute}-${index}`}
              style={styles.goalItem}
            >
              {goal.matchMinute ?? "-"}' {goal.goalGetterName ?? "Goal"}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
