import type { MetadataRoute } from "next";
import { PROJECTS } from "@/lib/projects.config";

import { SITE_URL } from "@/lib/constants";

const baseUrl = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/issues`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...PROJECTS.map((proj) => ({
      url: `${baseUrl}/project/${proj.id}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
