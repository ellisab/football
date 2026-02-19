import type { ApiTableRow } from "@footballleagues/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@footballleagues/ui/card";
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
      mobileRow: "border-[#d9a3ad] bg-[#fff2f5]",
      positionBadge: "bg-[#d5001d] text-white",
      desktopRow: "bg-[#fff5f7]",
      zone: "Leaders",
    };
  }

  if (index < 4) {
    return {
      mobileRow: "border-[#dcc2c9] bg-[#fff8fa]",
      positionBadge: "bg-[#f2d9de] text-[#8f1730]",
      desktopRow: "bg-[#fff9fb]",
      zone: "Europe",
    };
  }

  if (index >= Math.max(totalRows - 3, 0)) {
    return {
      mobileRow: "border-[#d1d4dc] bg-[#f5f6f9]",
      positionBadge: "bg-[#e6e8ee] text-[#2f3340]",
      desktopRow: "bg-[#f8f9fb]",
      zone: "Relegation",
    };
  }

  return {
    mobileRow: "border-[#d9dce4] bg-[#fcfcfe]",
    positionBadge: "bg-[#eef0f4] text-[#4f535e]",
    desktopRow: "",
    zone: "Midtable",
  };
};

export function StandingsCard({ table }: StandingsCardProps) {
  return (
    <Card className="frost-card gap-0 overflow-hidden border-[#d8dbe3] bg-[#ffffff] py-0 shadow-none">
      <CardHeader className="border-b border-[#e0e2e9] py-5">
        <CardTitle className="font-display text-[1.85rem] leading-none text-[#12141a] sm:text-[2.2rem]">
          <span className="inline-flex items-center gap-2">
            <Medal className="h-6 w-6 text-[#b61028]" />
            Table
          </span>
        </CardTitle>
        <CardDescription className="text-[#4f525a]">
          Updated standings with qualification and relegation context.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 py-4 sm:px-6 sm:py-5">
        <div className="sm:hidden">
          <div className="grid gap-2 px-4 pb-2">
            {table.map((row, index) => {
              const rankTone = getRankTone(index, table.length);

              return (
                <div
                  key={row.teamInfoId ?? row.teamName}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm text-[#1a1d25] ${rankTone.mobileRow}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${rankTone.positionBadge}`}
                    >
                      {index + 1}
                    </span>
                    <TeamBadge name={row.teamName} iconUrl={row.teamIconUrl} />
                    <span className="min-w-0 truncate font-semibold">{row.teamName}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[0.65rem] uppercase tracking-[0.08em] text-[#5e616a]">
                      {rankTone.zone}
                    </div>
                    <div className="text-base font-semibold text-[#ae1127]">{row.points} pts</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden overflow-x-auto px-4 pb-2 sm:block sm:px-0">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="border-[#e0e2e9]">
                <TableHead className="w-12 text-[#5c6069]">Pos</TableHead>
                <TableHead className="text-[#5c6069]">Team</TableHead>
                <TableHead className="text-[#5c6069]">MP</TableHead>
                <TableHead className="text-[#5c6069]">W</TableHead>
                <TableHead className="text-[#5c6069]">D</TableHead>
                <TableHead className="text-[#5c6069]">L</TableHead>
                <TableHead className="text-[#5c6069]">GD</TableHead>
                <TableHead className="text-right text-[#5c6069]">Pts</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {table.map((row, index) => {
                const rankTone = getRankTone(index, table.length);

                return (
                  <TableRow
                    key={row.teamInfoId ?? row.teamName}
                    className={`border-[#e5e7ee] ${rankTone.desktopRow}`}
                  >
                    <TableCell className="font-semibold text-[#4d515b]">{index + 1}</TableCell>
                    <TableCell className="font-semibold text-[#14161d]">
                      <div className="flex items-center gap-3">
                        <TeamBadge name={row.teamName} iconUrl={row.teamIconUrl} />
                        <span>{row.teamName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#4d515b]">{row.matches}</TableCell>
                    <TableCell className="text-[#4d515b]">{row.won}</TableCell>
                    <TableCell className="text-[#4d515b]">{row.draw}</TableCell>
                    <TableCell className="text-[#4d515b]">{row.lost}</TableCell>
                    <TableCell className="text-[#4d515b]">{row.goalDiff}</TableCell>
                    <TableCell className="text-right font-semibold text-[#ae1127]">
                      <span className="inline-flex items-center gap-1">
                        {row.points}
                        <Goal className="h-3.5 w-3.5" />
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
