import { formatKickoff } from "@footballleagues/core/matches";

type LocalKickoffProps = {
  value?: string;
  fallback?: string;
};

export function LocalKickoff({ value, fallback = "Termin offen" }: LocalKickoffProps) {
  const label = value ? formatKickoff(value) : fallback;

  return <span>{label}</span>;
}
