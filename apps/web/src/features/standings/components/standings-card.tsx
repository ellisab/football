import type { ApiTableRow } from "@footballleagues/core/openligadb";
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
      mobileRow: "border-[#2d553f] bg-[#15261f]",
      positionBadge: "bg-[#3dffa0] text-[#0c0e12]",
      desktopRow: "bg-[#121f1a]",
      zone: "Leaders",
    };
  }

  if (index < 4) {
    return {
      mobileRow: "border-[#2a3441] bg-[#151a22]",
      positionBadge: "bg-[#1f2835] text-[#8aa0c0]",
      desktopRow: "bg-[#141a23]",
      zone: "Europe",
    };
  }

  if (index >= Math.max(totalRows - 3, 0)) {
    return {
      mobileRow: "border-[#46303a] bg-[#23171d]",
      positionBadge: "bg-[#3a2530] text-[#f2bdcb]",
      desktopRow: "bg-[#1f151a]",
      zone: "Relegation",
    };
  }

  return {
    mobileRow: "border-[#232937] bg-[#131720]",
    positionBadge: "bg-[#1d2431] text-[#98a4bb]",
    desktopRow: "",
    zone: "Midtable",
  };
};

export function StandingsCard({ table }: StandingsCardProps) {
  return (
    <Card className="gap-0 overflow-hidden border-[#222530] bg-[#12161f] py-0 shadow-none">
      <CardHeader className="border-b border-[#1e2230] py-5">
        <CardTitle className="text-[1.85rem] leading-none font-[var(--font-stadium-heading)] uppercase text-[#ffffff] sm:text-[2.2rem]">
          <span className="inline-flex items-center gap-2">
            <Medal className="h-6 w-6 text-[#3dffa0]" />
            Table
          </span>
        </CardTitle>
        <CardDescription className="text-[#9ca6ba]">
          Updated standings with qualification and relegation context.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 py-4 sm:px-6 sm:py-5">
        <div className="sm:hidden w-full min-w-0">
          <div className="flex w-full min-w-0 flex-col gap-2 px-4 pb-2">
            {table.map((row, index) => {
              const rankTone = getRankTone(index, table.length);

              return (
                <div
                  key={row.teamInfoId ?? row.teamName}
                  className={`flex items-center w-full min-w-0 justify-between gap-3 rounded-2xl border px-3 py-3 text-sm text-[#d6dce8] sm:px-4 ${rankTone.mobileRow}`}
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
                      className="shrink-0 bg-[#1f2633]"
                    />
                    <span className="truncate font-semibold">{row.teamName}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[0.65rem] uppercase tracking-[0.08em] text-[#9aa4ba]">
                      {rankTone.zone}
                    </div>
                    <div className="text-base font-semibold text-[#3dffa0]">
                      {row.points} pts
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
              <TableRow className="border-[#1f2330]">
                <TableHead className="w-12 text-[#9ba4b9]">Pos</TableHead>
                <TableHead className="text-[#9ba4b9]">Team</TableHead>
                <TableHead className="text-[#9ba4b9]">MP</TableHead>
                <TableHead className="text-[#9ba4b9]">W</TableHead>
                <TableHead className="text-[#9ba4b9]">D</TableHead>
                <TableHead className="text-[#9ba4b9]">L</TableHead>
                <TableHead className="text-[#9ba4b9]">GD</TableHead>
                <TableHead className="text-right text-[#9ba4b9]">Pts</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {table.map((row, index) => {
                const rankTone = getRankTone(index, table.length);

                return (
                  <TableRow
                    key={row.teamInfoId ?? row.teamName}
                    className={`border-[#1e2330] ${rankTone.desktopRow}`}
                  >
                    <TableCell className="font-semibold text-[#9ba4b9]">{index + 1}</TableCell>
                    <TableCell className="font-semibold text-[#f0f3f8]">
                      <div className="flex items-center gap-3">
                        <TeamBadge
                          name={row.teamName}
                          iconUrl={row.teamIconUrl}
                          className="bg-[#1f2633]"
                        />
                        <span>{row.teamName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#9ba4b9]">{row.matches}</TableCell>
                    <TableCell className="text-[#9ba4b9]">{row.won}</TableCell>
                    <TableCell className="text-[#9ba4b9]">{row.draw}</TableCell>
                    <TableCell className="text-[#9ba4b9]">{row.lost}</TableCell>
                    <TableCell className="text-[#9ba4b9]">{row.goalDiff}</TableCell>
                    <TableCell className="text-right font-semibold text-[#3dffa0]">
                      <span className="inline-flex items-center gap-1">
                        {row.points}
                        <Goal className="h-3.5 w-3.5 text-[#3dffa0]" />
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
