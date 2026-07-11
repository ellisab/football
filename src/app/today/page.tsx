import type { Metadata } from "next";
import { TodayView } from "@/features/today/components/today-view";
import { resolveDateQuery } from "@/features/football/components/date-navigator";
import { getHomePageData } from "@/features/home/server/get-home-page-data";

export const dynamic = "force-dynamic";

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
  const data = await getHomePageData({});

  return <TodayView data={data} dateKey={dateKey} />;
}
