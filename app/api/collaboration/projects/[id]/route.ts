import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";
import { getProjectById, updateProject, deleteProject } from "@/lib/collaboration/projectsRepo";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { departmentId: true } });
  const project = await getProjectById(id, user.id, u?.departmentId ?? null);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = {
    title: typeof body.title === "string" ? body.title.trim() : undefined,
    summary: typeof body.summary === "string" ? body.summary.trim() || null : undefined,
    description: typeof body.description === "string" ? body.description.trim() || null : undefined,
    status: body.status as any,
    visibility: body.visibility as any,
    departmentId: typeof body.departmentId === "string" ? body.departmentId || null : undefined,
    fields: Array.isArray(body.fields) ? body.fields.filter((x): x is string => typeof x === "string") : undefined,
    requiredRoles: Array.isArray(body.requiredRoles) ? body.requiredRoles.filter((x): x is string => typeof x === "string") : undefined,
    capacity: typeof body.capacity === "number" ? body.capacity : undefined,
    startDate: typeof body.startDate === "string" ? body.startDate || null : undefined,
    endDate: typeof body.endDate === "string" ? body.endDate || null : undefined,
    tags: Array.isArray(body.tags) ? body.tags.filter((x): x is string => typeof x === "string") : undefined,
  };

  const updated = await updateProject(id, user.id, data);
  if (!updated) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ok = await deleteProject(id, user.id);
  if (!ok) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  return NextResponse.json({ success: true });
}
