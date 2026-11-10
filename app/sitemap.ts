import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getSiteOrigin } from "@/lib/cv/siteUrl";
import { buildPublicCvPath } from "@/lib/cv/slug";

export const revalidate = 3600; // كل ساعة

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();

  const researchers = await prisma.user.findMany({
    where: {
      role: "RESEARCHER",
      isActive: true,
      cvPublicEnabled: true,
      profileSlug: { not: null },
    },
    select: {
      profileSlug: true,
      updatedAt: true,
      fullNameEn: true,
      fullNameAr: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  const cvEntries: MetadataRoute.Sitemap = researchers
    .filter((r) => r.profileSlug)
    .map((r) => ({
      url: `${origin}${buildPublicCvPath(r.profileSlug!)}`,
      lastModified: r.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [
    {
      url: origin,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${origin}/researchers`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${origin}/about/creator`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    ...cvEntries,
  ];
}
