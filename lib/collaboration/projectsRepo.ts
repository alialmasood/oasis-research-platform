import { prisma } from "@/lib/db";
import type { Prisma, CollaborationProjectStatus, CollaborationVisibility } from "@prisma/client";

export type CreateProjectInput = {
  title: string;
  summary?: string | null;
  description?: string | null;
  status?: CollaborationProjectStatus;
  visibility?: CollaborationVisibility;
  departmentId?: string | null;
  fields?: string[];
  requiredRoles?: string[];
  capacity?: number;
  startDate?: string | null;
  endDate?: string | null;
  tags?: string[];
};

export async function createProject(ownerId: string, input: CreateProjectInput) {
  const { tags = [], ...rest } = input;
  const project = await prisma.collaborationProject.create({
    data: {
      ...rest,
      ownerId,
      fields: rest.fields ?? [],
      requiredRoles: rest.requiredRoles ?? [],
      capacity: rest.capacity ?? 5,
      tags: tags.length
        ? { create: tags.map((tag) => ({ tag: tag.trim() })).filter((t) => t.tag) }
        : undefined,
    },
    include: {
      tags: true,
      owner: { select: { id: true, fullNameAr: true, fullNameEn: true, email: true } },
      _count: { select: { members: true, joinRequests: true } },
    },
  });
  await prisma.projectMember.create({
    data: { projectId: project.id, researcherId: ownerId, role: "OWNER" },
  });
  return prisma.collaborationProject.findUnique({
    where: { id: project.id },
    include: {
      tags: true,
      members: { include: { researcher: { select: { id: true, fullNameAr: true, fullNameEn: true } } } },
      owner: { select: { id: true, fullNameAr: true, fullNameEn: true, email: true } },
      _count: { select: { joinRequests: true } },
    },
  });
}

export async function listProjects(options: {
  userId: string;
  userDepartmentId?: string | null;
  status?: CollaborationProjectStatus;
  visibility?: CollaborationVisibility;
  mine?: boolean;
}) {
  const { userId, userDepartmentId, status, visibility, mine } = options;
  const where: Prisma.CollaborationProjectWhereInput = {};

  if (status) where.status = status;
  if (visibility) where.visibility = visibility;

  if (mine) {
    where.OR = [
      { ownerId: userId },
      { members: { some: { researcherId: userId, isActive: true } } },
    ];
  } else {
    where.OR = [
      { visibility: "UNIVERSITY" },
      ...(userDepartmentId ? [{ visibility: "COLLEGE_ONLY" as const, departmentId: userDepartmentId }] : []),
      { ownerId: userId },
    ];
  }

  return prisma.collaborationProject.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      tags: true,
      owner: { select: { id: true, fullNameAr: true, fullNameEn: true } },
      _count: { select: { members: true, joinRequests: true } },
    },
  });
}

export async function getProjectById(projectId: string, userId: string, userDepartmentId?: string | null) {
  const project = await prisma.collaborationProject.findUnique({
    where: { id: projectId },
    include: {
      tags: true,
      members: { where: { isActive: true }, include: { researcher: { select: { id: true, fullNameAr: true, fullNameEn: true, email: true } } } },
      joinRequests: { where: { status: "PENDING" }, include: { requester: { select: { id: true, fullNameAr: true, fullNameEn: true } } } },
      owner: { select: { id: true, fullNameAr: true, fullNameEn: true, email: true } },
    },
  });
  if (!project) return null;
  if (project.visibility === "PRIVATE" && project.ownerId !== userId) return null;
  if (project.visibility === "COLLEGE_ONLY" && project.departmentId !== userDepartmentId && project.ownerId !== userId) return null;
  return project;
}

export async function updateProject(
  projectId: string,
  userId: string,
  data: Partial<CreateProjectInput>
) {
  const project = await prisma.collaborationProject.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) return null;
  const { tags, ...rest } = data;
  if (tags !== undefined) {
    await prisma.projectTag.deleteMany({ where: { projectId } });
    if (tags.length) {
      await prisma.projectTag.createMany({
        data: tags.map((tag) => ({ projectId, tag: tag.trim() })).filter((t) => t.tag),
        skipDuplicates: true,
      });
    }
  }
  return prisma.collaborationProject.update({
    where: { id: projectId },
    data: {
      ...rest,
      fields: data.fields ?? undefined,
      requiredRoles: data.requiredRoles ?? undefined,
    },
    include: {
      tags: true,
      owner: { select: { id: true, fullNameAr: true, fullNameEn: true } },
      _count: { select: { members: true, joinRequests: true } },
    },
  });
}

export async function deleteProject(projectId: string, userId: string) {
  const project = await prisma.collaborationProject.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) return false;
  await prisma.collaborationProject.delete({ where: { id: projectId } });
  return true;
}

export async function getProjectMemberRole(projectId: string, userId: string): Promise<"OWNER" | "CO_LEAD" | "MEMBER" | null> {
  const m = await prisma.projectMember.findFirst({
    where: { projectId, researcherId: userId, isActive: true },
  });
  return m?.role ?? null;
}
