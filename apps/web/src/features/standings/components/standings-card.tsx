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
import type { DesignDirection } from "@/features/matchday/server/types";
import { TeamBadge } from "@/features/teams/components/team-badge";

type StandingsCardProps = {
  table: ApiTableRow[];
  direction?: DesignDirection;
};

type RankTone = {
  mobileRow: string;
  positionBadge: string;
  desktopRow: string;
  zone: string;
};

const getRankTone = (
  index: number,
  totalRows: number,
  direction: DesignDirection
): RankTone => {
  const isGazette = direction === "gazette";

  if (index === 0) {
    return {
      mobileRow: isGazette
        ? "border-[#dcc8a0] bg-[#fcf4e5]"
        : "border-[#2d553f] bg-[#15261f]",
      positionBadge: isGazette ? "bg-[#e8b84b] text-[#1a1612]" : "bg-[#3dffa0] text-[#0c0e12]",
      desktopRow: isGazette ? "bg-[#fff8ed]" : "bg-[#121f1a]",
      zone: "Leaders",
    };
  }

  if (index < 4) {
    return {
      mobileRow: isGazette
        ? "border-[#e6dac5] bg-[#fffcf6]"
        : "border-[#2a3441] bg-[#151a22]",
      positionBadge: isGazette ? "bg-[#f2ead8] text-[#8c6c2c]" : "bg-[#1f2835] text-[#8aa0c0]",
      desktopRow: isGazette ? "bg-[#fffdf8]" : "bg-[#141a23]",
      zone: "Europe",
    };
  }

  if (index >= Math.max(totalRows - 3, 0)) {
    return {
      mobileRow: isGazette
        ? "border-[#e1d7ca] bg-[#f8f2ea]"
        : "border-[#46303a] bg-[#23171d]",
      positionBadge: isGazette ? "bg-[#ece2d5] text-[#5f5547]" : "bg-[#3a2530] text-[#f2bdcb]",
      desktopRow: isGazette ? "bg-[#faf5ee]" : "bg-[#1f151a]",
      zone: "Relegation",
    };
  }

  return {
    mobileRow: isGazette
      ? "border-[#e8dfd3] bg-[#fffdf9]"
      : "border-[#232937] bg-[#131720]",
    positionBadge: isGazette ? "bg-[#f2ebe1] text-[#60594e]" : "bg-[#1d2431] text-[#98a4bb]",
    desktopRow: "",
    zone: "Midtable",
  };
};

export function StandingsCard({ table, direction = "stadium" }: StandingsCardProps) {
  const isGazette = direction === "gazette";

  return (
    <Card
      className={`gap-0 overflow-hidden py-0 shadow-none ${
        isGazette
          ? "border-[#e0d8cc] bg-[#fffdf9]"
          : "border-[#222530] bg-[#12161f]"
      }`}
    >
      <CardHeader className={`py-5 ${isGazette ? "border-b border-[#e8dfd3]" : "border-b border-[#1e2230]"}`}>
        <CardTitle
          className={`text-[1.85rem] leading-none sm:text-[2.2rem] ${
            isGazette
              ? "font-[var(--font-gazette-heading)] text-[#1a1612]"
              : "font-[var(--font-stadium-heading)] uppercase text-[#ffffff]"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Medal className={`h-6 w-6 ${isGazette ? "text-[#8c6c2c]" : "text-[#3dffa0]"}`} />
            Table
          </span>
        </CardTitle>
        <CardDescription className={isGazette ? "text-[#6b6257]" : "text-[#9ca6ba]"}>
          Updated standings with qualification and relegation context.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 py-4 sm:px-6 sm:py-5">
        <div className="sm:hidden w-full min-w-0">
          <div className="flex flex-col gap-2 px-4 pb-2 w-full min-w-0">
            {table.map((row, index) => {
              const rankTone = getRankTone(index, table.length, direction);

              return (
                <div
                  key={row.teamInfoId ?? row.teamName}
                  className={`flex items-center w-full min-w-0 justify-between gap-3 rounded-2xl border px-3 py-3 sm:px-4 text-sm ${
                    isGazette ? "text-[#2a2420]" : "text-[#d6dce8]"
                  } ${rankTone.mobileRow}`}
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
                      className={`shrink-0 ${isGazette ? "bg-[#f1ebe1]" : "bg-[#1f2633]"}`}
                    />
                    <span className="truncate font-semibold">{row.teamName}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <div
                      className={`text-[0.65rem] uppercase tracking-[0.08em] ${
                        isGazette ? "text-[#6f665a]" : "text-[#9aa4ba]"
                      }`}
                    >
                      {rankTone.zone}
                    </div>
                    <div className={`text-base font-semibold ${isGazette ? "text-[#1a1612]" : "text-[#3dffa0]"}`}>
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
              <TableRow className={isGazette ? "border-[#e8dfd3]" : "border-[#1f2330]"}>
                <TableHead className={`w-12 ${isGazette ? "text-[#6b6257]" : "text-[#9ba4b9]"}`}>Pos</TableHead>
                <TableHead className={isGazette ? "text-[#6b6257]" : "text-[#9ba4b9]"}>Team</TableHead>
                <TableHead className={isGazette ? "text-[#6b6257]" : "text-[#9ba4b9]"}>MP</TableHead>
                <TableHead className={isGazette ? "text-[#6b6257]" : "text-[#9ba4b9]"}>W</TableHead>
                <TableHead className={isGazette ? "text-[#6b6257]" : "text-[#9ba4b9]"}>D</TableHead>
                <TableHead className={isGazette ? "text-[#6b6257]" : "text-[#9ba4b9]"}>L</TableHead>
                <TableHead className={isGazette ? "text-[#6b6257]" : "text-[#9ba4b9]"}>GD</TableHead>
                <TableHead className={`text-right ${isGazette ? "text-[#6b6257]" : "text-[#9ba4b9]"}`}>Pts</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {table.map((row, index) => {
                const rankTone = getRankTone(index, table.length, direction);

                return (
                  <TableRow
                    key={row.teamInfoId ?? row.teamName}
                    className={`${isGazette ? "border-[#ece4d8]" : "border-[#1e2330]"} ${rankTone.desktopRow}`}
                  >
                    <TableCell className={`font-semibold ${isGazette ? "text-[#595244]" : "text-[#9ba4b9]"}`}>
                      {index + 1}
                    </TableCell>
                    <TableCell className={`font-semibold ${isGazette ? "text-[#14110d]" : "text-[#f0f3f8]"}`}>
                      <div className="flex items-center gap-3">
                        <TeamBadge
                          name={row.teamName}
                          iconUrl={row.teamIconUrl}
                          className={isGazette ? "bg-[#f1ebe1]" : "bg-[#1f2633]"}
                        />
                        <span>{row.teamName}</span>
                      </div>
                    </TableCell>
                    <TableCell className={isGazette ? "text-[#595244]" : "text-[#9ba4b9]"}>{row.matches}</TableCell>
                    <TableCell className={isGazette ? "text-[#595244]" : "text-[#9ba4b9]"}>{row.won}</TableCell>
                    <TableCell className={isGazette ? "text-[#595244]" : "text-[#9ba4b9]"}>{row.draw}</TableCell>
                    <TableCell className={isGazette ? "text-[#595244]" : "text-[#9ba4b9]"}>{row.lost}</TableCell>
                    <TableCell className={isGazette ? "text-[#595244]" : "text-[#9ba4b9]"}>{row.goalDiff}</TableCell>
                    <TableCell className={`text-right font-semibold ${isGazette ? "text-[#1a1612]" : "text-[#3dffa0]"}`}>
                      <span className="inline-flex items-center gap-1">
                        {row.points}
                        <Goal className={`h-3.5 w-3.5 ${isGazette ? "text-[#8c6c2c]" : "text-[#3dffa0]"}`} />
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
