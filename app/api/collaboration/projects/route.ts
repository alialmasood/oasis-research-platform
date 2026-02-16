import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";
import { createProject, listProjects } from "@/lib/collaboration/projectsRepo";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as "DRAFT" | "OPEN" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED" | null;
  const visibility = searchParams.get("visibility") as "UNIVERSITY" | "COLLEGE_ONLY" | "PRIVATE" | null;
  const mine = searchParams.get("mine") === "1" || searchParams.get("mine") === "true";

  const u = await prisma.user.findUnique({
    where: { id: user.id },
    select: { departmentId: true },
  });

  const list = await listProjects({
    userId: user.id,
    userDepartmentId: u?.departmentId ?? null,
    status: status ?? undefined,
    visibility: visibility ?? undefined,
    mine: mine || undefined,
  });
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.roles.includes("RESEARCHER")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof (body as any).title === "string" ? (body as any).title.trim() : "";
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const input = {
    title,
    summary: typeof (body as any).summary === "string" ? (body as any).summary.trim() || null : null,
    description: typeof (body as any).description === "string" ? (body as any).description.trim() || null : null,
    status: ((body as any).status as any) ?? "DRAFT",
    visibility: ((body as any).visibility as any) ?? "UNIVERSITY",
    departmentId: typeof (body as any).departmentId === "string" ? (body as any).departmentId || null : null,
    fields: Array.isArray((body as any).fields) ? (body as any).fields.filter((x: unknown) => typeof x === "string") : [],
    requiredRoles: Array.isArray((body as any).requiredRoles) ? (body as any).requiredRoles.filter((x: unknown) => typeof x === "string") : [],
    capacity: typeof (body as any).capacity === "number" ? (body as any).capacity : 5,
    startDate: typeof (body as any).startDate === "string" ? (body as any).startDate || null : null,
    endDate: typeof (body as any).endDate === "string" ? (body as any).endDate || null : null,
    tags: Array.isArray((body as any).tags) ? (body as any).tags.filter((x: unknown) => typeof x === "string") : [],
  };

  const project = await createProject(user.id, input);
  return NextResponse.json(project);
}
