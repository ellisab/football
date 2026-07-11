import type { Metadata } from "next";
import { SearchPageView } from "@/features/search/search-page";
import { getHomePageData } from "@/features/home/server/get-home-page-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suchen",
  description: "Teams, Wettbewerbe, Spiele und Spieltage durchsuchen.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, data] = await Promise.all([searchParams, getHomePageData({})]);
  return <SearchPageView data={data} initialQuery={q?.trim() ?? ""} />;
}
