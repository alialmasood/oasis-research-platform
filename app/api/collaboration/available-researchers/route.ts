import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";

/** باحثون متاحون للتعاون: عرض في قسم "باحثون متاحون حالياً" */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await prisma.user.findMany({
    where: {
      id: { not: user.id },
      isActive: true,
      researcherProfile: { isNot: null },
    },
    select: {
      id: true,
      fullNameAr: true,
      fullNameEn: true,
      generalSpecialization: true,
      specificSpecialization: true,
      departmentId: true,
      departmentRelation: { select: { name: true } },
      researcherProfile: {
        select: {
          availabilityStatus: true,
          headline: true,
          interests: true,
          avatarUrl: true,
        },
      },
      _count: { select: { publications: true } },
    },
    take: 24,
  });

  const items = list.map((u) => ({
    id: u.id,
    fullNameAr: u.fullNameAr,
    fullNameEn: u.fullNameEn,
    college: u.departmentRelation?.name ?? null,
    specialization: u.generalSpecialization || u.specificSpecialization || (u.researcherProfile?.interests?.[0] ?? null),
    researchCount: u._count?.publications ?? 0,
    availabilityStatus: u.researcherProfile?.availabilityStatus ?? null,
    headline: u.researcherProfile?.headline ?? null,
    avatarUrl: u.researcherProfile?.avatarUrl ?? null,
  }));

  return NextResponse.json(items);
}
