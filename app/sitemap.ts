import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1, changeFrequency: "monthly" as const },
    { path: "/athena", priority: 0.5, changeFrequency: "monthly" as const },
    {
      path: "/flashcards",
      priority: 0.5,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/duck-duck-goose",
      priority: 0.5,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/system-design-dle",
      priority: 0.5,
      changeFrequency: "weekly" as const,
    },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
