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

  const [links, profile] = await Promise.all([
    prisma.researcherLinks.findUnique({ where: { userId: user.id } }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { fullNameAr: true, fullNameEn: true, email: true },
    }),
  ]);

  const preferredName =
    profile?.fullNameEn?.trim() ||
    profile?.fullNameAr?.trim() ||
    profile?.email ||
    null;

  const metrics = await resolveExternalProfileMetrics({
    links,
    preferredName,
    nameCandidates: [profile?.fullNameEn, profile?.fullNameAr],
  });

  return NextResponse.json({
    researcher: {
      id: user.id,
      name: preferredName,
      fullNameAr: profile?.fullNameAr ?? null,
      fullNameEn: profile?.fullNameEn ?? null,
    },
    metrics,
  });
}
