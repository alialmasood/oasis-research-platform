import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";
import { getResearchersForProject } from "@/lib/collaboration/recommendations";

/** أفضل 5 باحثين لمشروعك مع درجة توافق % */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  if (!projectId) return NextResponse.json({ error: "Project ID required" }, { status: 400 });

  const list = await getResearchersForProject(projectId, user.id);
  const top5 = list.slice(0, 5);
  if (top5.length === 0) return NextResponse.json([]);

  const maxScore = Math.max(...top5.map((x) => x.score), 1);
  const ids = top5.map((x) => x.researcher.id);

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      fullNameAr: true,
      fullNameEn: true,
      departmentRelation: { select: { name: true } },
      _count: { select: { publications: true } },
    },
  });
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));

  const result = top5.map((item) => {
    const u = byId[item.researcher.id];
    const scorePercent = Math.min(100, Math.round((item.score / maxScore) * 100));
    return {
      id: item.researcher.id,
      fullNameAr: item.researcher.fullNameAr,
      fullNameEn: item.researcher.fullNameEn,
      college: u?.departmentRelation?.name ?? null,
      researchCount: u?._count?.publications ?? 0,
      availabilityStatus: item.researcher.profile?.availabilityStatus ?? null,
      scorePercent,
    };
  });

  return NextResponse.json(result);
}
