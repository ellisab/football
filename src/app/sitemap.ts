import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const routes = [
    { path: "", priority: 1 },
    { path: "/today", priority: 0.95 },
    { path: "/live", priority: 0.92 },
    { path: "/competitions", priority: 0.9 },
    { path: "/competitions/bundesliga-1", priority: 0.9 },
    { path: "/competitions/bundesliga-2", priority: 0.88 },
    { path: "/competitions/women", priority: 0.86 },
    { path: "/competitions/dfb-pokal", priority: 0.85 },
    { path: "/competitions/champions-league", priority: 0.88 },
    { path: "/tables", priority: 0.82 },
    { path: "/teams", priority: 0.8 },
    { path: "/search", priority: 0.72 },
    { path: "/favorites", priority: 0.7 },
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: "hourly",
    priority: route.priority,
  }));
}
