import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    activeProjects,
    completedProjects,
    openProjects,
    myPendingRequests,
    totalResearchers,
    availableResearchers,
    snapshot,
  ] = await Promise.all([
    (prisma as any).collaborationProject?.count?.({ where: { status: "IN_PROGRESS" } }).catch(() => 0) ?? 0,
    (prisma as any).collaborationProject?.count?.({ where: { status: "COMPLETED" } }).catch(() => 0) ?? 0,
    (prisma as any).collaborationProject?.count?.({ where: { status: "OPEN" } }).catch(() => 0) ?? 0,
    (prisma as any).joinRequest?.count?.({
      where: { status: "PENDING", project: { ownerId: user.id } },
    }).catch(() => 0) ?? 0,
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: true, researcherProfile: { availabilityStatus: "AVAILABLE" } } }),
    (prisma as any).recommendationSnapshot?.findUnique?.({
      where: { researcherId_type: { researcherId: user.id, type: "PROJECTS_FOR_YOU" } },
      select: { payloadJson: true },
    }).catch(() => null),
  ]);

  const payload = snapshot?.payloadJson as { highPriority?: unknown[]; recommended?: unknown[] } | null;
  const highPriorityCount = Array.isArray(payload?.highPriority) ? payload.highPriority.length : 0;
  const totalRecs = highPriorityCount + (Array.isArray(payload?.recommended) ? payload.recommended.length : 0);

  return NextResponse.json({
    activeProjects: Number(activeProjects) || 0,
    completedProjects: Number(completedProjects) || 0,
    openProjects: Number(openProjects) || 0,
    pendingRequests: Number(myPendingRequests) || 0,
    totalResearchers: Number(totalResearchers) || 0,
    availableResearchers: Number(availableResearchers) || 0,
    totalRecommendations: totalRecs,
    highPriorityRecommendations: highPriorityCount,
  });
}
