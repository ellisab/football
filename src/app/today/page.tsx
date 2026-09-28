import type { Metadata } from "next";
import { resolveDateQuery } from "@/features/football/components/date-navigator";
import { TodayView } from "@/features/today/components/today-view";
import { getTodayPageData } from "@/features/today/server/get-today-page-data";

export const metadata: Metadata = {
  title: "Heute",
  description: "Heutige Fußballspiele, Anstoßzeiten und Ergebnisse.",
};

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const dateKey = resolveDateQuery(params.date);
  const { data, matches } = await getTodayPageData(dateKey);

  return <TodayView data={data} dateKey={dateKey} matches={matches} />;
}
