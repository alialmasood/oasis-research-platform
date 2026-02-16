import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";

/** Incoming: طلبات لمشاريعي. Outgoing: طلباتي للمشاريع الأخرى */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") === "outgoing" ? "outgoing" : "incoming";

  if (type === "outgoing") {
    const list = await (prisma as any).joinRequest?.findMany?.({
      where: { requesterId: user.id },
      include: {
        project: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    }).catch(() => []);
    return NextResponse.json(list ?? []);
  }

  const requests = await (prisma as any).joinRequest?.findMany?.({
    where: {
      project: {
        OR: [
          { ownerId: user.id },
          { members: { some: { researcherId: user.id, role: "CO_LEAD", isActive: true } } },
        ],
      },
    },
    include: {
      project: { select: { id: true, title: true } },
      requester: {
        select: {
          id: true,
          fullNameAr: true,
          fullNameEn: true,
          email: true,
          departmentId: true,
          departmentRelation: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const withSkills = await Promise.all(
    (requests ?? []).map(async (r: any) => {
      const skills = await (prisma as any).researcherSkill?.findMany?.({
        where: { researcherId: r.requesterId },
        select: { skill: true },
      }).catch(() => []);
      return { ...r, requesterSkills: skills ?? [] };
    })
  );

  return NextResponse.json(withSkills);
}
