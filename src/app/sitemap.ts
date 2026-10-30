import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const publicRoutes = [
  { path: "", priority: 1 },
  { path: "/about", priority: 0.7 },
  { path: "/features", priority: 0.8 },
  { path: "/contact", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map(({ path, priority }) => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly",
    priority,
  }));
}
