import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";
import { getProjectsForResearcher, getResearchersForProject } from "@/lib/collaboration/recommendations";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (projectId) {
    const researchers = await getResearchersForProject(projectId, user.id);
    return NextResponse.json({ researchersForProject: researchers });
  }

  const projectsForYou = await getProjectsForResearcher(user.id);
  const high = projectsForYou.filter((p) => p.priority === "high");
  const recommended = projectsForYou.filter((p) => p.priority === "recommended");

  const payload = { highPriority: high, recommended };
  try {
    await prisma.recommendationSnapshot.upsert({
      where: { researcherId_type: { researcherId: user.id, type: "PROJECTS_FOR_YOU" } },
      create: { researcherId: user.id, type: "PROJECTS_FOR_YOU", payloadJson: payload as any },
      update: { payloadJson: payload as any },
    });
  } catch {
    // قد لا يكون الجدول محدّثاً بعد
  }
  return NextResponse.json(payload);
}
