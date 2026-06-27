import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const routes = [
    { path: "", priority: 1 },
    { path: "/today", priority: 0.95 },
    { path: "/competitions/world-cup", priority: 0.9 },
    { path: "/competitions/bundesliga-1", priority: 0.9 },
    { path: "/competitions/bundesliga-2", priority: 0.88 },
    { path: "/competitions/women", priority: 0.86 },
    { path: "/competitions/men", priority: 0.84 },
    { path: "/tables", priority: 0.82 },
    { path: "/teams", priority: 0.8 },
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: "hourly",
    priority: route.priority,
  }));
}
