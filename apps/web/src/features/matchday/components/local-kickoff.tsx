"use client";

import { formatKickoff } from "@footballleagues/core/matches";

type LocalKickoffProps = {
  value?: string;
  fallback?: string;
};

export function LocalKickoff({ value, fallback = "TBD" }: LocalKickoffProps) {
  const isClient = typeof window !== "undefined";
  const label = isClient ? (value ? formatKickoff(value) : fallback) : fallback;

  return <span suppressHydrationWarning>{label}</span>;
}
