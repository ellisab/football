import { Text, View } from "react-native";
import type { ApiTableRow } from "@footballleagues/core/openligadb";
import type { AppStyles } from "../../../app/theme/styles";
import { TeamBadge } from "../../teams/components/team-badge";

export function TableRow({
  row,
  index,
  total,
  styles,
}: {
  row: ApiTableRow;
  index: number;
  total: number;
  styles: AppStyles;
}) {
  const isLeader = index === 0;
  const isEurope = index > 0 && index < 4;
  const isBottom = index >= Math.max(total - 3, 0);

  const zoneLabel = isLeader
    ? "Leaders"
    : isEurope
      ? "Europe"
      : isBottom
        ? "Relegation"
        : "Midtable";

  return (
    <View>
      <View
        style={[
          styles.tableRow,
          isLeader && styles.tableRowLeader,
          isEurope && styles.tableRowEurope,
          isBottom && styles.tableRowBottom,
        ]}
      >
        <View style={styles.tableMain}>
          <View
            style={[
              styles.tablePosBadge,
              isLeader && styles.tablePosLeader,
              isEurope && styles.tablePosEurope,
              isBottom && styles.tablePosBottom,
            ]}
          >
            <Text
              style={[
                styles.tablePosText,
                isLeader && styles.tablePosTextLeader,
                isEurope && styles.tablePosTextEurope,
                isBottom && styles.tablePosTextBottom,
              ]}
            >
              {index + 1}
            </Text>
          </View>
          <View style={styles.tableCellTeam}>
            <TeamBadge
              name={row.teamName}
              iconUrl={row.teamIconUrl}
              size={20}
              styles={styles}
            />
            <Text style={styles.tableCellTeamText} numberOfLines={1}>
              {row.teamName ?? "Team"}
            </Text>
          </View>
        </View>

        <View style={styles.tableMeta}>
          <Text style={styles.tableZone}>{zoneLabel}</Text>
          <Text style={styles.tableCellPts}>{row.points ?? 0} pts</Text>
        </View>
      </View>

      <View style={styles.tableStatsRow}>
        <Text style={styles.tableStat}>MP {row.matches ?? 0}</Text>
        <Text style={styles.tableStat}>W {row.won ?? 0}</Text>
        <Text style={styles.tableStat}>D {row.draw ?? 0}</Text>
        <Text style={styles.tableStat}>L {row.lost ?? 0}</Text>
        <Text style={styles.tableStat}>GD {row.goalDiff ?? 0}</Text>
      </View>
    </View>
  );
}
