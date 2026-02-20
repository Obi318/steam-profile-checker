import { getSiteUrl } from "./seo";
import { allIndexableRoutes } from "./marketing-data";

export default function sitemap() {
  const baseUrl = getSiteUrl();
  const now = new Date();

  return allIndexableRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : route.startsWith("/game/") ? 0.9 : 0.8,
  }));
}
