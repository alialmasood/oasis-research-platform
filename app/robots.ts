import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/cv/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cv/", "/researchers", "/about/", "/humans.txt"],
        disallow: [
          "/researcher/",
          "/admin/",
          "/super-admin/",
          "/login",
          "/register",
          "/api/",
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
