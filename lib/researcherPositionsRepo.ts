import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

function getDelegate() {
  const delegate = (prisma as any).position;
  if (!delegate || typeof delegate.findMany !== "function") {
    throw new Error(
      "Prisma client لا يتضمن موديل المناصب. أعد تشغيل خادم التطوير (dev server) ثم نفّذ: npx prisma generate"
    );
  }
  return delegate;
}

export type CreateResearcherPositionInput = {
  title: string;
  positionDate: Date;
  durationYears: number;
  durationMonths: number;
  durationDays: number;
  organization: string;
  description?: string | null;
};

export type ResearcherPositionFilters = {
  search?: string;
  organization?: string;
  year?: number;
};

export async function createResearcherPosition(
  researcherId: string,
  data: CreateResearcherPositionInput
) {
  return getDelegate().create({
    data: {
      researcherId,
      title: data.title.trim(),
      positionDate: data.positionDate,
      durationYears: data.durationYears,
      durationMonths: data.durationMonths,
      durationDays: data.durationDays,
      organization: data.organization.trim(),
      description: data.description?.trim() || null,
    },
  });
}

export async function updateResearcherPosition(
  id: string,
  researcherId: string,
  data: Partial<CreateResearcherPositionInput>
) {
  const existing = await getResearcherPositionById(id, researcherId);
  if (!existing) return null;
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.positionDate !== undefined) payload.positionDate = data.positionDate;
  if (data.durationYears !== undefined) payload.durationYears = data.durationYears;
  if (data.durationMonths !== undefined) payload.durationMonths = data.durationMonths;
  if (data.durationDays !== undefined) payload.durationDays = data.durationDays;
  if (data.organization !== undefined) payload.organization = data.organization.trim();
  if (data.description !== undefined) payload.description = data.description?.trim() || null;
  if (Object.keys(payload).length === 0) return existing;
  return getDelegate().update({
    where: { id },
    data: payload,
  });
}

export async function deleteResearcherPosition(id: string, researcherId: string) {
  const d = getDelegate();
  const existing = await d.findFirst({
    where: { id, researcherId },
  });
  if (!existing) return null;
  return d.delete({
    where: { id },
  });
}

export async function getResearcherPositionById(id: string, researcherId: string) {
  return getDelegate().findFirst({
    where: { id, researcherId },
  });
}

function buildWhere(researcherId: string, filters?: ResearcherPositionFilters) {
  const where: Prisma.PositionWhereInput = {
    researcherId,
  };
  if (filters?.organization) {
    where.organization = { contains: filters.organization, mode: "insensitive" };
  }
  if (filters?.year) {
    const startOfYear = new Date(filters.year, 0, 1);
    const endOfYear = new Date(filters.year, 11, 31, 23, 59, 59);
    where.positionDate = {
      gte: startOfYear,
      lte: endOfYear,
    };
  }
  if (filters?.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { organization: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listResearcherPositions(
  researcherId: string,
  filters?: ResearcherPositionFilters
) {
  const where = buildWhere(researcherId, filters);
  return getDelegate().findMany({
    where,
    orderBy: [{ positionDate: "desc" }, { createdAt: "desc" }],
  });
}
