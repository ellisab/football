"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@footballleagues/ui/select";

export type LeagueOption = {
  shortcut: string;
  label: string;
  seasons: number[];
};

type LeagueSelectorProps = {
  leagues: LeagueOption[];
  currentLeague: string;
};

export function LeagueSelector({
  leagues,
  currentLeague,
}: LeagueSelectorProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const pushRoute = (nextLeague: string, nextSeason: number) => {
    startTransition(() => {
      router.push(`/?league=${nextLeague}&season=${nextSeason}`);
    });
  };

  const onLeagueChange = (value: string) => {
    const nextSeasons =
      leagues.find((item) => item.shortcut === value)?.seasons ?? [];
    const fallbackSeason = nextSeasons[0] ?? new Date().getFullYear();

    pushRoute(value, fallbackSeason);
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Select value={currentLeague} onValueChange={onLeagueChange}>
          <SelectTrigger className="w-full border-white/20 bg-white/5 text-slate-100">
            <SelectValue placeholder="Select league" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            align="start"
            sideOffset={8}
            className="w-[--radix-select-trigger-width] max-w-[calc(100vw-2rem)] border-white/10 bg-slate-950/95 text-slate-100 shadow-xl backdrop-blur"
          >
            {leagues.map((item) => (
              <SelectItem
                key={item.shortcut}
                value={item.shortcut}
                className="focus:bg-white/10"
              >
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
