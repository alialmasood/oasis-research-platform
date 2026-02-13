import { prisma } from "@/lib/db";
import type { Prisma, WorkshopParticipationType } from "@prisma/client";

function getDelegate() {
  const delegate = (prisma as any).workshop;
  if (!delegate || typeof delegate.findMany !== "function") {
    throw new Error(
      "Prisma client لا يتضمن موديل ورش العمل. أعد تشغيل خادم التطوير (dev server) ثم نفّذ: npx prisma generate"
    );
  }
  return delegate;
}

export type CreateResearcherWorkshopInput = {
  title: string;
  date: Date;
  beneficiary: string;
  location: string;
  participationType: WorkshopParticipationType;
  description?: string | null;
};

export type ResearcherWorkshopFilters = {
  search?: string;
  beneficiary?: string;
  participationType?: WorkshopParticipationType | string;
  year?: number;
};

export async function createResearcherWorkshop(
  researcherId: string,
  data: CreateResearcherWorkshopInput
) {
  return getDelegate().create({
    data: {
      researcherId,
      title: data.title.trim(),
      date: data.date,
      beneficiary: data.beneficiary.trim(),
      location: data.location.trim(),
      participationType: data.participationType as WorkshopParticipationType,
      description: data.description?.trim() || null,
    },
  });
}

export async function updateResearcherWorkshop(
  id: string,
  researcherId: string,
  data: Partial<CreateResearcherWorkshopInput>
) {
  const existing = await getResearcherWorkshopById(id, researcherId);
  if (!existing) return null;
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.date !== undefined) payload.date = data.date;
  if (data.beneficiary !== undefined) payload.beneficiary = data.beneficiary.trim();
  if (data.location !== undefined) payload.location = data.location.trim();
  if (data.participationType !== undefined) payload.participationType = data.participationType;
  if (data.description !== undefined) payload.description = data.description?.trim() || null;
  if (Object.keys(payload).length === 0) return existing;
  return getDelegate().update({
    where: { id },
    data: payload,
  });
}

export async function deleteResearcherWorkshop(id: string, researcherId: string) {
  const d = getDelegate();
  const existing = await d.findFirst({
    where: { id, researcherId },
  });
  if (!existing) return null;
  return d.delete({
    where: { id },
  });
}

export async function getResearcherWorkshopById(id: string, researcherId: string) {
  return getDelegate().findFirst({
    where: { id, researcherId },
  });
}

function buildWhere(researcherId: string, filters?: ResearcherWorkshopFilters) {
  const where: Prisma.WorkshopWhereInput = {
    researcherId,
  };
  if (filters?.beneficiary) {
    where.beneficiary = { contains: filters.beneficiary, mode: "insensitive" };
  }
  if (filters?.participationType) {
    where.participationType = filters.participationType as WorkshopParticipationType;
  }
  if (filters?.year) {
    const startOfYear = new Date(filters.year, 0, 1);
    const endOfYear = new Date(filters.year, 11, 31, 23, 59, 59);
    where.date = {
      gte: startOfYear,
      lte: endOfYear,
    };
  }
  if (filters?.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { beneficiary: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listResearcherWorkshops(
  researcherId: string,
  filters?: ResearcherWorkshopFilters
) {
  const where = buildWhere(researcherId, filters);
  return getDelegate().findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}
