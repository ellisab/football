import type { Metadata } from "next";
import { CompetitionDirectory } from "@/features/competitions/components/competition-directory";

export const metadata: Metadata = {
  title: "Wettbewerbe",
  description: "Alle unterstützten Fußballligen und Turniere.",
};

export default async function CompetitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <CompetitionDirectory query={q?.trim() ?? ""} />;
}
