import { prisma } from "@/lib/db";
import type { Prisma, CommitteeRole } from "@prisma/client";

function getDelegate() {
  const delegate = (prisma as any).committee;
  if (!delegate || typeof delegate.findMany !== "function") {
    throw new Error(
      "Prisma client لا يتضمن موديل اللجان. أعد تشغيل خادم التطوير (dev server) ثم نفّذ: npx prisma generate"
    );
  }
  return delegate;
}

export type CreateResearcherCommitteeInput = {
  title: string;
  assignmentDate: Date;
  role: CommitteeRole;
  description?: string | null;
};

export type ResearcherCommitteeFilters = {
  search?: string;
  role?: CommitteeRole | string;
  year?: number;
};

export async function createResearcherCommittee(
  researcherId: string,
  data: CreateResearcherCommitteeInput
) {
  return getDelegate().create({
    data: {
      researcherId,
      title: data.title.trim(),
      assignmentDate: data.assignmentDate,
      role: data.role as CommitteeRole,
      description: data.description?.trim() || null,
    },
  });
}

export async function updateResearcherCommittee(
  id: string,
  researcherId: string,
  data: Partial<CreateResearcherCommitteeInput>
) {
  const existing = await getResearcherCommitteeById(id, researcherId);
  if (!existing) return null;
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.assignmentDate !== undefined) payload.assignmentDate = data.assignmentDate;
  if (data.role !== undefined) payload.role = data.role;
  if (data.description !== undefined) payload.description = data.description?.trim() || null;
  if (Object.keys(payload).length === 0) return existing;
  return getDelegate().update({
    where: { id },
    data: payload,
  });
}

export async function deleteResearcherCommittee(id: string, researcherId: string) {
  const d = getDelegate();
  const existing = await d.findFirst({
    where: { id, researcherId },
  });
  if (!existing) return null;
  return d.delete({
    where: { id },
  });
}

export async function getResearcherCommitteeById(id: string, researcherId: string) {
  return getDelegate().findFirst({
    where: { id, researcherId },
  });
}

function buildWhere(researcherId: string, filters?: ResearcherCommitteeFilters) {
  const where: Prisma.CommitteeWhereInput = {
    researcherId,
  };
  if (filters?.role) {
    where.role = filters.role as CommitteeRole;
  }
  if (filters?.year) {
    const startOfYear = new Date(filters.year, 0, 1);
    const endOfYear = new Date(filters.year, 11, 31, 23, 59, 59);
    where.assignmentDate = {
      gte: startOfYear,
      lte: endOfYear,
    };
  }
  if (filters?.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listResearcherCommittees(
  researcherId: string,
  filters?: ResearcherCommitteeFilters
) {
  const where = buildWhere(researcherId, filters);
  return getDelegate().findMany({
    where,
    orderBy: [{ assignmentDate: "desc" }, { createdAt: "desc" }],
  });
}
