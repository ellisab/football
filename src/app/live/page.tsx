import type { Metadata } from "next";
import { LiveView } from "@/features/live/components/live-view";
import { getHomePageData } from "@/features/home/server/get-home-page-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live",
  description: "Möglicherweise laufende Fußballspiele und die nächsten Anstoßzeiten.",
};

export default async function LivePage() {
  const data = await getHomePageData({});
  return <LiveView data={data} />;
}
