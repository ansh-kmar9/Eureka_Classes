import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated areas are never useful in search results.
      disallow: ["/admin", "/teacher", "/dashboard", "/api/"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
