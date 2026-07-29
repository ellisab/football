import type { ApiTableRow } from "@footballleagues/core/openligadb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@footballleagues/ui/table";
import Link from "next/link";
import { getTeamId } from "@/features/football/view-utils";
import { TeamBadge } from "@/features/teams/components/team-badge";

type StandingsCardProps = {
  emptyText?: string;
  table: ApiTableRow[];
};

const value = (candidate: number | undefined) =>
  typeof candidate === "number" ? candidate : "–";

export function StandingsCard({
  emptyText = "Tabellendaten sind noch nicht verfügbar.",
  table,
}: StandingsCardProps) {
  if (table.length === 0) {
    return (
      <div role="status" className="empty-table-state">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="standings-surface">
      <Table className="standings-table">
        <caption className="sr-only">
          Tabelle mit Platzierung, Team, Spielen, Siegen, Unentschieden,
          Niederlagen, Tordifferenz und Punkten
        </caption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Pos</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="w-12 text-center">Sp</TableHead>
            <TableHead className="standings-secondary w-12 text-center">
              S
            </TableHead>
            <TableHead className="standings-secondary w-12 text-center">
              U
            </TableHead>
            <TableHead className="standings-secondary w-12 text-center">
              N
            </TableHead>
            <TableHead className="w-14 text-center">TD</TableHead>
            <TableHead className="w-16 text-right">Pkt.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.map((row, index) => (
            <TableRow key={row.teamInfoId ?? `${row.teamName}-${index}`}>
              <TableCell className="font-mono text-[var(--text-muted)]">
                {index + 1}
              </TableCell>
              <TableCell className="min-w-[10rem] font-semibold text-[var(--text)]">
                <Link
                  href={`/teams/${getTeamId(row)}`}
                  className="standings-team-link"
                >
                  <TeamBadge
                    name={row.teamName}
                    iconUrl={row.teamIconUrl}
                    size={28}
                    decorative
                    className="team-badge-surface shrink-0"
                  />
                  <span className="truncate">
                    {row.teamName ?? row.shortName ?? "Team"}
                  </span>
                </Link>
              </TableCell>
              <TableCell className="text-center">
                {value(row.matches)}
              </TableCell>
              <TableCell className="standings-secondary text-center">
                {value(row.won)}
              </TableCell>
              <TableCell className="standings-secondary text-center">
                {value(row.draw)}
              </TableCell>
              <TableCell className="standings-secondary text-center">
                {value(row.lost)}
              </TableCell>
              <TableCell className="text-center">
                {value(row.goalDiff)}
              </TableCell>
              <TableCell className="font-mono text-right font-bold text-[var(--text)]">
                {value(row.points)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
