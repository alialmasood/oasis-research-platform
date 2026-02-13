import { prisma } from "@/lib/db";
import type { Prisma, FieldVisitActivityType } from "@prisma/client";

export type CreateFieldVisitInput = {
  type: FieldVisitActivityType;
  title: string;
  activityDate: Date;
  description?: string | null;
  documentationRef?: string | null;
};

export type FieldVisitFilters = {
  type?: FieldVisitActivityType;
  year?: number;
  search?: string;
};

export async function createFieldVisit(researcherId: string, data: CreateFieldVisitInput) {
  return prisma.fieldVisit.create({
    data: {
      researcherId,
      type: data.type,
      title: data.title.trim(),
      activityDate: data.activityDate,
      description: data.description?.trim() || null,
      documentationRef: data.documentationRef?.trim() || null,
    },
  });
}

export async function updateFieldVisit(
  id: string,
  researcherId: string,
  data: Partial<CreateFieldVisitInput>
) {
  const existing = await getFieldVisitById(id, researcherId);
  if (!existing) return null;
  const payload: Record<string, unknown> = {};
  if (data.type !== undefined) payload.type = data.type;
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.activityDate !== undefined) payload.activityDate = data.activityDate;
  if (data.description !== undefined) payload.description = data.description?.trim() || null;
  if (data.documentationRef !== undefined) payload.documentationRef = data.documentationRef?.trim() || null;
  if (Object.keys(payload).length === 0) return existing;
  return prisma.fieldVisit.update({
    where: { id },
    data: payload,
  });
}

export async function deleteFieldVisit(id: string, researcherId: string) {
  const existing = await prisma.fieldVisit.findFirst({
    where: { id, researcherId },
  });
  if (!existing) return null;
  return prisma.fieldVisit.delete({ where: { id } });
}

export async function getFieldVisitById(id: string, researcherId: string) {
  return prisma.fieldVisit.findFirst({
    where: { id, researcherId },
  });
}

function buildWhere(
  researcherId: string,
  filters?: FieldVisitFilters
): Prisma.FieldVisitWhereInput {
  const where: Prisma.FieldVisitWhereInput = {
    researcherId,
  };
  if (filters?.type) where.type = filters.type;
  if (filters?.year) {
    where.activityDate = {
      gte: new Date(filters.year, 0, 1),
      lte: new Date(filters.year, 11, 31, 23, 59, 59),
    };
  }
  if (filters?.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { documentationRef: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listFieldVisits(researcherId: string, filters?: FieldVisitFilters) {
  const where = buildWhere(researcherId, filters);
  return prisma.fieldVisit.findMany({
    where,
    orderBy: [{ activityDate: "desc" }, { createdAt: "desc" }],
  });
}
