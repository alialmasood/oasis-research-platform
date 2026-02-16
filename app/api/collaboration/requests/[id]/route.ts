import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";
import { getProjectMemberRole } from "@/lib/collaboration/projectsRepo";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: requestId } = await params;
  let body: { status?: string } = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {}

  const status = body.status as "APPROVED" | "REJECTED" | "CANCELED" | undefined;
  if (!status || !["APPROVED", "REJECTED", "CANCELED"].includes(status))
    return NextResponse.json({ error: "status must be APPROVED, REJECTED, or CANCELED" }, { status: 400 });

  const joinRequest = await (prisma as any).joinRequest?.findUnique?.({
    where: { id: requestId },
    include: { project: true },
  });
  if (!joinRequest) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  if (joinRequest.status !== "PENDING")
    return NextResponse.json({ error: "Request already decided" }, { status: 400 });

  const isRequester = joinRequest.requesterId === user.id;
  const role = await getProjectMemberRole(joinRequest.projectId, user.id);
  const canDecide = role === "OWNER" || role === "CO_LEAD";

  if (status === "CANCELED") {
    if (!isRequester) return NextResponse.json({ error: "Only the requester can cancel" }, { status: 403 });
  } else {
    if (!canDecide) return NextResponse.json({ error: "Only owner or co-lead can accept/reject" }, { status: 403 });
  }

  const updated = await (prisma as any).joinRequest?.update?.({
    where: { id: requestId },
    data: { status, decidedAt: new Date(), decidedBy: status === "CANCELED" ? user.id : user.id },
    include: { requester: { select: { id: true, fullNameAr: true, fullNameEn: true } }, project: { select: { id: true, title: true } } },
  });

  if (status === "APPROVED") {
    const project = await (prisma as any).collaborationProject?.findUnique?.({ where: { id: joinRequest.projectId } });
    const currentCount = await (prisma as any).projectMember?.count?.({ where: { projectId: joinRequest.projectId, isActive: true } }).catch(() => 0);
    if (project && project.capacity > (currentCount ?? 0)) {
      await (prisma as any).projectMember?.create?.({
        data: { projectId: joinRequest.projectId, researcherId: joinRequest.requesterId, role: "MEMBER" },
      });
    }
    await (prisma as any).notification?.create?.({
      data: {
        userId: joinRequest.requesterId,
        type: "COLLABORATION_JOIN_APPROVED",
        title: "تم قبول طلب الانضمام",
        body: `تم قبول طلبك للانضمام إلى مشروع: ${project?.title ?? ""}`,
        link: `/researcher/collaboration`,
      },
    }).catch(() => {});
  }

  return NextResponse.json(updated);
}
