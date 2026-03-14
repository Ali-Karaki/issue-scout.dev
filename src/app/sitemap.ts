import type { MetadataRoute } from "next";
import { ECOSYSTEMS } from "@/lib/ecosystems.config";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.issue-scout.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/issues`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...ECOSYSTEMS.map((eco) => ({
      url: `${baseUrl}/ecosystem/${eco.id}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
