import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

function getDelegate() {
  const delegate = (prisma as any).reviewing;
  if (!delegate || typeof delegate.findMany !== "function") {
    throw new Error(
      "Prisma client لا يتضمن موديل التقويم العلمي. أعد تشغيل خادم التطوير (dev server) ثم نفّذ: npx prisma generate"
    );
  }
  return delegate;
}

export type CreateResearcherReviewingInput = {
  title: string;
  type: "RESEARCHES" | "SCIENTIFIC_ARTICLES" | "THESES" | "PATENTS" | "SCIENTIFIC_CONSULTATIONS";
  date: Date;
  description?: string | null;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
};

export type ResearcherReviewingFilters = {
  search?: string;
  type?: string;
  status?: string;
  year?: number;
};

export async function createResearcherReviewing(
  researcherId: string,
  data: CreateResearcherReviewingInput
) {
  return getDelegate().create({
    data: {
      researcherId,
      title: data.title.trim(),
      type: data.type,
      date: data.date,
      description: data.description?.trim() || null,
      status: data.status,
    },
  });
}

export async function updateResearcherReviewing(
  id: string,
  researcherId: string,
  data: Partial<CreateResearcherReviewingInput>
) {
  const existing = await getResearcherReviewingById(id, researcherId);
  if (!existing) return null;
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.type !== undefined) payload.type = data.type;
  if (data.date !== undefined) payload.date = data.date;
  if (data.status !== undefined) payload.status = data.status;
  if (data.description !== undefined) payload.description = data.description?.trim() || null;
  if (Object.keys(payload).length === 0) return existing;
  return getDelegate().update({
    where: { id },
    data: payload,
  });
}

export async function deleteResearcherReviewing(id: string, researcherId: string) {
  const d = getDelegate();
  const existing = await d.findFirst({
    where: { id, researcherId },
  });
  if (!existing) return null;
  return d.delete({
    where: { id },
  });
}

export async function getResearcherReviewingById(id: string, researcherId: string) {
  return getDelegate().findFirst({
    where: { id, researcherId },
  });
}

function buildWhere(researcherId: string, filters?: ResearcherReviewingFilters) {
  const where: Prisma.ReviewingWhereInput = {
    researcherId,
  };
  if (filters?.type) {
    where.type = filters.type as any;
  }
  if (filters?.status) {
    where.status = filters.status as any;
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
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listResearcherReviewings(
  researcherId: string,
  filters?: ResearcherReviewingFilters
) {
  const where = buildWhere(researcherId, filters);
  return getDelegate().findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}
