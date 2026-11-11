import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";
import { resolveExternalProfileMetrics } from "@/lib/research/externalProfileMetrics";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.roles.includes("RESEARCHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [links, profile, localResearch] = await Promise.all([
    prisma.researcherLinks.findUnique({ where: { userId: user.id } }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { fullNameAr: true, fullNameEn: true, email: true },
    }),
    prisma.research.findMany({
      where: {
        researcherId: user.id,
        OR: [{ publishStatus: "PUBLISHED" }, { status: "COMPLETED" }],
      },
      select: {
        title: true,
        year: true,
        doi: true,
        researchUrl: true,
        downloadUrl: true,
        categories: true,
      },
      orderBy: [{ year: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  const preferredName =
    profile?.fullNameEn?.trim() ||
    profile?.fullNameAr?.trim() ||
    null;

  const metrics = await resolveExternalProfileMetrics({
    links,
    // مرجع الهوية الأساسي حسب توجيه إدارة الجامعة
    officialEmail: profile?.email ?? null,
    preferredName,
    nameCandidates: [profile?.fullNameEn, profile?.fullNameAr],
    localPublications: localResearch.map((row) => ({
      title: row.title,
      year: row.year,
      doi: row.doi,
      researchUrl: row.researchUrl,
      downloadUrl: row.downloadUrl,
      categories: row.categories,
    })),
  });

  return NextResponse.json({
    researcher: {
      id: user.id,
      name: preferredName,
      email: profile?.email ?? null,
      fullNameAr: profile?.fullNameAr ?? null,
      fullNameEn: profile?.fullNameEn ?? null,
    },
    metrics,
  });
}
