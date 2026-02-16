import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  let body: { message?: string } = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {}

  const project = await prisma.collaborationProject.findUnique({
    where: { id: projectId },
    include: { members: true, _count: { select: { members: true } } },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const alreadyMember = project.members.some((m) => m.researcherId === user.id && m.isActive);
  if (alreadyMember) return NextResponse.json({ error: "أنت عضو بالفعل في المشروع" }, { status: 400 });

  const existingRequest = await prisma.joinRequest.findUnique({
    where: { projectId_requesterId: { projectId, requesterId: user.id } },
  });
  if (existingRequest) {
    if (existingRequest.status === "PENDING") return NextResponse.json({ error: "لديك طلب قيد المراجعة" }, { status: 400 });
    if (existingRequest.status === "APPROVED") return NextResponse.json({ error: "تم قبول طلبك مسبقاً" }, { status: 400 });
  }

  if (project._count.members >= project.capacity) return NextResponse.json({ error: "المشروع ممتلئ" }, { status: 400 });

  const message = typeof body.message === "string" ? body.message.trim() || null : null;
  const req = await prisma.joinRequest.upsert({
    where: { projectId_requesterId: { projectId, requesterId: user.id } },
    create: { projectId, requesterId: user.id, message, status: "PENDING" },
    update: { message, status: "PENDING" },
    include: { requester: { select: { id: true, fullNameAr: true, fullNameEn: true } } },
  });
  return NextResponse.json(req);
}
