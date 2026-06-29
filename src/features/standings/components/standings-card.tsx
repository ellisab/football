import Link from "next/link";
import type { ApiTableRow } from "@footballleagues/core/openligadb";
import { Card, CardContent, CardHeader, CardTitle } from "@footballleagues/ui/card";
import { Goal, Medal } from "lucide-react";
import { getTeamId } from "@/features/football/view-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@footballleagues/ui/table";
import { TeamBadge } from "@/features/teams/components/team-badge";

type StandingsCardProps = {
  emptyText?: string;
  table: ApiTableRow[];
};

type RankTone = {
  mobileRow: string;
  positionBadge: string;
  desktopRow: string;
  zone: string;
};

const getRankTone = (index: number, totalRows: number): RankTone => {
  if (index === 0) {
    return {
      mobileRow: "border-[#d8b86a]/35 bg-[linear-gradient(135deg,rgba(82,63,20,0.68),rgba(8,40,34,0.84))]",
      positionBadge: "bg-[linear-gradient(135deg,#f5edc9_0%,#d8b86a_54%,#ffb45f_100%)] text-[#030708]",
      desktopRow: "bg-[rgba(92,73,28,0.18)]",
      zone: "Krone",
    };
  }

  if (index < 4) {
    return {
      mobileRow: "border-[#6eeaf2]/25 bg-[linear-gradient(135deg,rgba(9,46,49,0.72),rgba(9,31,29,0.86))]",
      positionBadge: "bg-[linear-gradient(135deg,rgba(110, 234, 242,0.26),rgba(38,126,112,0.34))] text-[#e6feff]",
      desktopRow: "bg-[rgba(8,42,45,0.22)]",
      zone: "Quali",
    };
  }

  if (index >= Math.max(totalRows - 3, 0)) {
    return {
      mobileRow: "border-[#ffb45f]/28 bg-[linear-gradient(135deg,rgba(70,36,15,0.78),rgba(34,22,16,0.82))]",
      positionBadge: "bg-[linear-gradient(135deg,rgba(255, 180, 95,0.24),rgba(178,108,62,0.32))] text-[#fff1de]",
      desktopRow: "bg-[rgba(70,39,18,0.24)]",
      zone: "Gefahr",
    };
  }

  return {
    mobileRow: "border-white/10 bg-[linear-gradient(135deg,rgba(8,26,31,0.82),rgba(7,16,21,0.92))]",
    positionBadge: "bg-white/10 text-[#d7e4dd]",
    desktopRow: "",
    zone: "Mitte",
  };
};

const getRecordDots = (row: ApiTableRow) => {
  const wins = Math.max(row.won ?? 0, 0);
  const draws = Math.max(row.draw ?? 0, 0);
  const losses = Math.max(row.lost ?? 0, 0);
  const total = wins + draws + losses;

  if (total === 0) return ["empty", "empty", "empty", "empty", "empty"] as const;

  const values = [
    ...Array.from({ length: Math.min(wins, 5) }, () => "win"),
    ...Array.from({ length: Math.min(draws, 5) }, () => "draw"),
    ...Array.from({ length: Math.min(losses, 5) }, () => "loss"),
  ].slice(0, 5);

  return values.length === 5
    ? values
    : [...values, ...Array.from({ length: 5 - values.length }, () => "empty")];
};

function RecordDots({ row }: { row: ApiTableRow }) {
  const dots = getRecordDots(row);

  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`Saisonbilanz: ${row.won ?? 0} Siege, ${row.draw ?? 0} Unentschieden, ${row.lost ?? 0} Niederlagen`}
    >
      {dots.map((dot, index) => (
        <span
          key={`${dot}-${index}`}
          className={`h-2 w-2 rounded-full ${
            dot === "win"
              ? "bg-[#43c886]"
              : dot === "draw"
                ? "bg-[#d8b86a]"
                : dot === "loss"
                  ? "bg-[#f45f63]"
                  : "bg-white/14"
          }`}
        />
      ))}
    </span>
  );
}

export function StandingsCard({
  emptyText = "Tabellendaten sind noch nicht verfügbar.",
  table,
}: StandingsCardProps) {
  const isEmpty = table.length === 0;

  return (
    <Card className="poster-surface gap-0 overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(7,27,32,0.92),rgba(8,17,22,0.98))] py-0 shadow-none">
      <CardHeader className="border-b border-white/10 py-5">
        <CardTitle className="text-[1.85rem] leading-none font-[var(--font-stadium-heading)] uppercase text-[#f5edc9] sm:text-[2.2rem]">
          <span className="inline-flex items-center gap-2">
            <Medal className="h-6 w-6 text-[#d8b86a]" />
            Tabelle
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 py-4 sm:px-6 sm:py-5">
        {isEmpty ? (
          <div
            role="status"
            className="mx-4 rounded-[1.2rem] border border-white/10 bg-white/[0.045] px-4 py-5 text-sm leading-6 text-[#a8bbb2] sm:mx-0"
          >
            {emptyText}
          </div>
        ) : (
          <>
            <div className="w-full min-w-0 sm:hidden">
              <div className="flex w-full min-w-0 flex-col gap-2 px-4 pb-2">
                {table.map((row, index) => {
                  const rankTone = getRankTone(index, table.length);

                  return (
                    <Link
                      href={`/teams/${getTeamId(row)}`}
                      key={row.teamInfoId ?? row.teamName}
                      className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-[1.4rem] border px-3 py-3 text-sm text-[#f2f7f2] sm:px-4 ${rankTone.mobileRow}`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <span
                          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${rankTone.positionBadge}`}
                        >
                          {index + 1}
                        </span>
                        <TeamBadge
                          name={row.teamName}
                          iconUrl={row.teamIconUrl}
                          className="shrink-0 bg-white/10 ring-1 ring-white/10"
                        />
                        <span className="truncate font-semibold">{row.teamName}</span>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[0.65rem] uppercase tracking-[0.14em] text-[#afc4bb]">
                          {rankTone.zone}
                        </div>
                        <div className="mt-1 flex justify-end">
                          <RecordDots row={row} />
                        </div>
                        <div className="text-base font-semibold text-[#d8b86a]">
                          {row.points} Pkt.
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="hidden px-4 pb-2 sm:block sm:px-0">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="w-10 text-[#afc4bb]">Pos</TableHead>
                    <TableHead className="text-[#afc4bb]">Team</TableHead>
                    <TableHead className="w-10 text-center text-[#afc4bb]">Sp</TableHead>
                    <TableHead className="w-10 text-center text-[#afc4bb]">S</TableHead>
                    <TableHead className="w-10 text-center text-[#afc4bb]">U</TableHead>
                    <TableHead className="w-10 text-center text-[#afc4bb]">N</TableHead>
                    <TableHead className="w-10 text-center text-[#afc4bb]">TD</TableHead>
                    <TableHead className="w-24 text-center text-[#afc4bb]">Form</TableHead>
                    <TableHead className="w-14 text-right text-[#afc4bb]">Pkt.</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {table.map((row, index) => {
                    const rankTone = getRankTone(index, table.length);

                    return (
                      <TableRow
                        key={row.teamInfoId ?? row.teamName}
                        className={`border-white/10 ${rankTone.desktopRow}`}
                      >
                        <TableCell className="font-semibold text-[#afc4bb]">
                          {index + 1}
                        </TableCell>
                        <TableCell className="min-w-0 font-semibold text-[#f2f7f2]">
                          <Link
                            href={`/teams/${getTeamId(row)}`}
                            className="flex min-w-0 items-center gap-2 transition-colors hover:text-[#d8b86a]"
                          >
                            <TeamBadge
                              name={row.teamName}
                              iconUrl={row.teamIconUrl}
                              className="shrink-0 bg-white/10 ring-1 ring-white/10"
                            />
                            <span className="truncate">{row.teamName}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-center text-[#afc4bb]">
                          {row.matches}
                        </TableCell>
                        <TableCell className="text-center text-[#afc4bb]">
                          {row.won}
                        </TableCell>
                        <TableCell className="text-center text-[#afc4bb]">
                          {row.draw}
                        </TableCell>
                        <TableCell className="text-center text-[#afc4bb]">
                          {row.lost}
                        </TableCell>
                        <TableCell className="text-center text-[#afc4bb]">
                          {row.goalDiff}
                        </TableCell>
                        <TableCell className="text-center text-[#afc4bb]">
                          <RecordDots row={row} />
                        </TableCell>
                        <TableCell className="text-right font-semibold text-[#d8b86a]">
                          <span className="inline-flex items-center gap-1">
                            {row.points}
                            <Goal className="h-3.5 w-3.5 text-[#6eeaf2]" />
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
