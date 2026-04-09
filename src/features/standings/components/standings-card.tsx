import type { ApiTableRow } from "@footballleagues/core/openligadb";
import { Card, CardContent, CardHeader, CardTitle } from "@footballleagues/ui/card";
import { Goal, Medal } from "lucide-react";
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
      mobileRow: "border-[#ffd66c]/35 bg-[linear-gradient(135deg,rgba(96,58,14,0.72),rgba(71,25,44,0.72))]",
      positionBadge: "bg-[linear-gradient(135deg,#fff6d0_0%,#ffd66c_54%,#ff9f63_100%)] text-[#1b0915]",
      desktopRow: "bg-[rgba(128,79,16,0.18)]",
      zone: "Krone",
    };
  }

  if (index < 4) {
    return {
      mobileRow: "border-[#57ebff]/25 bg-[linear-gradient(135deg,rgba(16,42,56,0.72),rgba(45,18,56,0.78))]",
      positionBadge: "bg-[linear-gradient(135deg,rgba(87,235,255,0.24),rgba(157,104,255,0.34))] text-[#dffcff]",
      desktopRow: "bg-[rgba(37,18,54,0.28)]",
      zone: "Orbit",
    };
  }

  if (index >= Math.max(totalRows - 3, 0)) {
    return {
      mobileRow: "border-[#ff7ca7]/28 bg-[linear-gradient(135deg,rgba(72,18,36,0.78),rgba(44,14,36,0.76))]",
      positionBadge: "bg-[linear-gradient(135deg,rgba(255,92,154,0.28),rgba(255,153,83,0.32))] text-[#ffe1ee]",
      desktopRow: "bg-[rgba(62,17,36,0.3)]",
      zone: "Red zone",
    };
  }

  return {
    mobileRow: "border-white/10 bg-[linear-gradient(135deg,rgba(35,15,47,0.82),rgba(18,10,29,0.9))]",
    positionBadge: "bg-white/10 text-[#f2d5e4]",
    desktopRow: "",
    zone: "Pulse",
  };
};

export function StandingsCard({ table }: StandingsCardProps) {
  return (
    <Card className="poster-surface gap-0 overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(39,14,47,0.88),rgba(22,9,31,0.96))] py-0 shadow-none">
      <CardHeader className="border-b border-white/10 py-5">
        <CardTitle className="text-[1.85rem] leading-none font-[var(--font-stadium-heading)] uppercase text-[#fff6fd] sm:text-[2.2rem]">
          <span className="inline-flex items-center gap-2">
            <Medal className="h-6 w-6 text-[#ffd66c]" />
            Tabelle
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 py-4 sm:px-6 sm:py-5">
        <div className="sm:hidden w-full min-w-0">
          <div className="flex w-full min-w-0 flex-col gap-2 px-4 pb-2">
            {table.map((row, index) => {
              const rankTone = getRankTone(index, table.length);

              return (
                <div
                  key={row.teamInfoId ?? row.teamName}
                  className={`flex items-center w-full min-w-0 justify-between gap-3 rounded-[1.4rem] border px-3 py-3 text-sm text-[#ffeef7] sm:px-4 ${rankTone.mobileRow}`}
                >
                  <div className="flex flex-1 min-w-0 items-center gap-2.5">
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
                    <div className="text-[0.65rem] uppercase tracking-[0.14em] text-[#efbfd5]">
                      {rankTone.zone}
                    </div>
                    <div className="text-base font-semibold text-[#ffd66c]">
                      {row.points} Pkt.
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden overflow-x-auto px-4 pb-2 sm:block sm:px-0">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="w-12 text-[#efbfd5]">Pos</TableHead>
                <TableHead className="text-[#efbfd5]">Team</TableHead>
                <TableHead className="text-[#efbfd5]">Sp</TableHead>
                <TableHead className="text-[#efbfd5]">S</TableHead>
                <TableHead className="text-[#efbfd5]">U</TableHead>
                <TableHead className="text-[#efbfd5]">N</TableHead>
                <TableHead className="text-[#efbfd5]">TD</TableHead>
                <TableHead className="text-right text-[#efbfd5]">Pkt.</TableHead>
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
                    <TableCell className="font-semibold text-[#efbfd5]">{index + 1}</TableCell>
                    <TableCell className="font-semibold text-[#fff4fb]">
                      <div className="flex items-center gap-3">
                        <TeamBadge
                          name={row.teamName}
                          iconUrl={row.teamIconUrl}
                          className="bg-white/10 ring-1 ring-white/10"
                        />
                        <span>{row.teamName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#efbfd5]">{row.matches}</TableCell>
                    <TableCell className="text-[#efbfd5]">{row.won}</TableCell>
                    <TableCell className="text-[#efbfd5]">{row.draw}</TableCell>
                    <TableCell className="text-[#efbfd5]">{row.lost}</TableCell>
                    <TableCell className="text-[#efbfd5]">{row.goalDiff}</TableCell>
                    <TableCell className="text-right font-semibold text-[#ffd66c]">
                      <span className="inline-flex items-center gap-1">
                        {row.points}
                        <Goal className="h-3.5 w-3.5 text-[#57ebff]" />
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
