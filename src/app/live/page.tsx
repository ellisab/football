import type { Metadata } from "next";
import { connection } from "next/server";
import { LiveView } from "@/features/live/components/live-view";
import { getLivePageData } from "@/features/live/server/get-live-page-data";

export const metadata: Metadata = {
  title: "Live",
  description: "Möglicherweise laufende Fußballspiele und die nächsten Anstoßzeiten.",
};

export default async function LivePage() {
  await connection();
  const data = await getLivePageData();

  return (
    <LiveView
      initialMatches={data.matches}
      visibleErrors={data.visibleErrors}
    />
  );
}
