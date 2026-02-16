import type { ApiTableRow } from "@footballleagues/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@footballleagues/ui/card";
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

export function StandingsCard({ table }: StandingsCardProps) {
  return (
    <Card className="border-slate-200 bg-white/70 shadow-[0_0_45px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/5">
      <CardHeader>
        <CardTitle className="text-xl text-slate-900 dark:text-slate-100 sm:text-2xl">
          Table
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-200/70">
          Updated standings for the selected season.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="sm:hidden">
          <div className="grid gap-2 px-4 pb-2">
            {table.map((row, index) => (
              <div
                key={row.teamInfoId ?? row.teamName}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-100/80 px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-950/40 dark:text-white"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-6 text-slate-600 dark:text-white/70">{index + 1}</span>
                  <TeamBadge name={row.teamName} iconUrl={row.teamIconUrl} />
                  <span className="min-w-0 truncate font-semibold">{row.teamName}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-600 dark:text-slate-300">Pts</div>
                  <div className="text-base font-semibold">{row.points}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden overflow-x-auto px-4 pb-2 sm:block sm:px-0">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="border-slate-200 dark:border-white/10">
                <TableHead className="w-12 text-slate-600 dark:text-slate-300">Pos</TableHead>
                <TableHead className="text-slate-600 dark:text-slate-300">Team</TableHead>
                <TableHead className="text-slate-600 dark:text-slate-300">MP</TableHead>
                <TableHead className="text-slate-600 dark:text-slate-300">W</TableHead>
                <TableHead className="text-slate-600 dark:text-slate-300">D</TableHead>
                <TableHead className="text-slate-600 dark:text-slate-300">L</TableHead>
                <TableHead className="text-slate-600 dark:text-slate-300">GD</TableHead>
                <TableHead className="text-right text-slate-600 dark:text-slate-300">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.map((row, index) => (
                <TableRow
                  key={row.teamInfoId ?? row.teamName}
                  className="border-slate-200/70 dark:border-white/5"
                >
                  <TableCell className="font-semibold text-slate-700 dark:text-white/80">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-3">
                      <TeamBadge name={row.teamName} iconUrl={row.teamIconUrl} />
                      <span>{row.teamName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-200">{row.matches}</TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-200">{row.won}</TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-200">{row.draw}</TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-200">{row.lost}</TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-200">{row.goalDiff}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-900 dark:text-white">
                    {row.points}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
