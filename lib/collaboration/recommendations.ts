import { prisma } from "@/lib/db";

export type ProjectForYou = {
  project: {
    id: string;
    title: string;
    summary: string | null;
    status: string;
    visibility: string;
    fields: string[];
    requiredRoles: string[];
    capacity: number;
    _count: { members: number };
    tags: { tag: string }[];
    owner: { fullNameAr: string | null; fullNameEn: string | null };
  };
  score: number;
  priority: "high" | "recommended";
};

export type ResearcherForProject = {
  researcher: {
    id: string;
    fullNameAr: string | null;
    fullNameEn: string | null;
    email: string;
    skills: string[];
    profile: { availabilityStatus: string | null; interests: string[] } | null;
  };
  score: number;
};

/** توصية مشاريع للباحث: +3 tag مشترك، +2 نفس القسم، +2 OPEN/IN_PROGRESS، +1 دور يطابق مهارة، -5 عضو أو طلب سابق */
export async function getProjectsForResearcher(userId: string): Promise<ProjectForYou[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      departmentId: true,
      researcherProfile: { select: { interests: true, departmentId: true } },
    },
  });
  if (!user) return [];

  let memberProjectIds = new Set<string>();
  let requestedProjectIds = new Set<string>();
  let userSkills: string[] = [];
  try {
    const [members, requests, skills] = await Promise.all([
      (prisma as any).projectMember?.findMany?.({ where: { researcherId: userId, isActive: true }, select: { projectId: true } }) ?? Promise.resolve([]),
      (prisma as any).joinRequest?.findMany?.({ where: { requesterId: userId, status: "PENDING" }, select: { projectId: true } }) ?? Promise.resolve([]),
      (prisma as any).researcherSkill?.findMany?.({ where: { researcherId: userId }, select: { skill: true } }) ?? Promise.resolve([]),
    ]);
    memberProjectIds = new Set((members ?? []).map((m: { projectId: string }) => m.projectId));
    requestedProjectIds = new Set((requests ?? []).map((r: { projectId: string }) => r.projectId));
    userSkills = (skills ?? []).map((s: { skill: string }) => s.skill.toLowerCase());
  } catch {
    // عميل قديم قد لا يتضمن موديلات التعاون
  }

  const userDepartmentId = user.departmentId ?? user.researcherProfile?.departmentId ?? null;
  const userInterests = user.researcherProfile?.interests ?? [];

  let projects: any[] = [];
  try {
    projects = await (prisma as any).collaborationProject.findMany({
    where: {
      status: { in: ["OPEN", "IN_PROGRESS"] },
      OR: [
        { visibility: "UNIVERSITY" },
        ...(userDepartmentId ? [{ visibility: "COLLEGE_ONLY", departmentId: userDepartmentId }] : []),
      ],
    },
    include: {
      tags: true,
      owner: { select: { fullNameAr: true, fullNameEn: true } },
      _count: { select: { members: true } },
    },
  });
  } catch {
    return [];
  }

  const scored: ProjectForYou[] = [];
  for (const p of projects) {
    if (memberProjectIds.has(p.id) || requestedProjectIds.has(p.id)) continue;
    let score = 0;
    const projectTags = (p.tags as { tag: string }[]).map((t) => t.tag.toLowerCase());
    for (const tag of projectTags) {
      if (userInterests.some((i) => i.toLowerCase().includes(tag) || tag.includes(i.toLowerCase()))) score += 3;
    }
    if (userDepartmentId && p.departmentId === userDepartmentId) score += 2;
    if (p.status === "OPEN" || p.status === "IN_PROGRESS") score += 2;
    for (const role of p.requiredRoles) {
      if (userSkills.some((s) => s.includes(role.toLowerCase()) || role.toLowerCase().includes(s))) score += 1;
    }
    if (score <= 0) continue;
    scored.push({
      project: {
        id: p.id,
        title: p.title,
        summary: p.summary,
        status: p.status,
        visibility: p.visibility,
        fields: p.fields,
        requiredRoles: p.requiredRoles,
        capacity: p.capacity,
        _count: p._count,
        tags: p.tags,
        owner: p.owner,
      },
      score,
      priority: score >= 5 ? "high" : "recommended",
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const high = scored.filter((s) => s.priority === "high").slice(0, 2);
  const recommended = scored.filter((s) => s.priority === "recommended").slice(0, 4);
  return [...high, ...recommended].slice(0, 6);
}

/** توصية باحثين لمشروع: +3 skill يطابق، +2 AVAILABLE، +1 نفس الكلية، -5 مرفوض أو مشغول جداً */
export async function getResearchersForProject(projectId: string, ownerId: string): Promise<ResearcherForProject[]> {
  let project: any;
  try {
    project = await (prisma as any).collaborationProject?.findUnique?.({
      where: { id: projectId },
      include: { tags: true, members: { where: { isActive: true }, select: { researcherId: true } }, joinRequests: true },
    });
  } catch {
    return [];
  }
  if (!project || project.ownerId !== ownerId) return [];

  const memberIds = new Set<string>(project.members.map((m: { researcherId: string }) => m.researcherId));
  const rejectedIds = new Set(project.joinRequests.filter((r: any) => r.status === "REJECTED").map((r: any) => r.requesterId));
  const projectTags = project.tags.map((t: any) => t.tag.toLowerCase());
  const requiredRoles = (project.requiredRoles as string[]).map((r) => r.toLowerCase());

  const researchers = await prisma.user.findMany({
    where: {
      id: { notIn: [...memberIds, ownerId] },
      isActive: true,
    },
    select: {
      id: true,
      fullNameAr: true,
      fullNameEn: true,
      email: true,
      departmentId: true,
      researcherProfile: { select: { availabilityStatus: true, interests: true } },
    },
  });

  const researcherIds = researchers.map((r) => r.id);
  let skillsByUser: Record<string, string[]> = {};
  try {
    const skillsList = await (prisma as any).researcherSkill?.findMany?.({
      where: { researcherId: { in: researcherIds } },
      select: { researcherId: true, skill: true },
    }) ?? [];
    for (const s of skillsList ?? []) {
      if (!skillsByUser[s.researcherId]) skillsByUser[s.researcherId] = [];
      skillsByUser[s.researcherId].push(s.skill.toLowerCase());
    }
  } catch {
    // عميل قديم
  }

  const scored: ResearcherForProject[] = [];
  for (const r of researchers) {
    if (rejectedIds.has(r.id)) continue;
    let score = 0;
    const skills = skillsByUser[r.id] ?? [];
    for (const tag of projectTags) {
      if (skills.some((s) => s.includes(tag) || tag.includes(s))) score += 3;
    }
    for (const role of requiredRoles) {
      if (skills.some((s) => s.includes(role) || role.includes(s))) score += 3;
    }
    if (r.researcherProfile?.availabilityStatus === "AVAILABLE") score += 2;
    if (r.departmentId === project.departmentId) score += 1;
    if (r.researcherProfile?.availabilityStatus === "BUSY") score -= 5;
    if (score <= 0) continue;
    scored.push({
      researcher: {
        id: r.id,
        fullNameAr: r.fullNameAr,
        fullNameEn: r.fullNameEn,
        email: r.email,
        skills: skills,
        profile: r.researcherProfile
          ? { availabilityStatus: r.researcherProfile.availabilityStatus, interests: r.researcherProfile.interests }
          : null,
      },
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 8);
}
