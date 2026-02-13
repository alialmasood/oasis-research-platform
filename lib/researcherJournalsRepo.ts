import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

function getDelegate() {
  const delegate = (prisma as any).journal;
  if (!delegate || typeof delegate.findMany !== "function") {
    throw new Error(
      "Prisma client لا يتضمن موديل المجلات. أعد تشغيل خادم التطوير (dev server) ثم نفّذ: npx prisma generate"
    );
  }
  return delegate;
}

export type CreateResearcherJournalInput = {
  name: string;
  role: "EDITOR_IN_CHIEF" | "ASSOCIATE_EDITOR" | "EDITORIAL_BOARD" | "REVIEWER";
  type: "LOCAL" | "INTERNATIONAL" | "ARABIC" | "ENGLISH";
  startDate: Date;
  isActive: boolean;
  endDate?: Date | null;
  impactFactor?: number | null;
  description?: string | null;
};

export type ResearcherJournalFilters = {
  search?: string;
  role?: string;
  type?: string;
  isActive?: boolean;
  year?: number;
};

export async function createResearcherJournal(
  researcherId: string,
  data: CreateResearcherJournalInput
) {
  return getDelegate().create({
    data: {
      researcherId,
      name: data.name.trim(),
      role: data.role,
      type: data.type,
      startDate: data.startDate,
      isActive: data.isActive,
      endDate: data.isActive ? null : (data.endDate || null),
      impactFactor: data.impactFactor || null,
      description: data.description?.trim() || null,
    },
  });
}

export async function updateResearcherJournal(
  id: string,
  researcherId: string,
  data: Partial<CreateResearcherJournalInput>
) {
  const existing = await getResearcherJournalById(id, researcherId);
  if (!existing) return null;
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.role !== undefined) payload.role = data.role;
  if (data.type !== undefined) payload.type = data.type;
  if (data.startDate !== undefined) payload.startDate = data.startDate;
  if (data.isActive !== undefined) {
    payload.isActive = data.isActive;
    if (data.isActive) {
      payload.endDate = null;
    } else if (data.endDate !== undefined) {
      payload.endDate = data.endDate;
    }
  } else if (data.endDate !== undefined) {
    payload.endDate = data.endDate;
  }
  if (data.impactFactor !== undefined) payload.impactFactor = data.impactFactor || null;
  if (data.description !== undefined) payload.description = data.description?.trim() || null;
  if (Object.keys(payload).length === 0) return existing;
  return getDelegate().update({
    where: { id },
    data: payload,
  });
}

export async function deleteResearcherJournal(id: string, researcherId: string) {
  const d = getDelegate();
  const existing = await d.findFirst({
    where: { id, researcherId },
  });
  if (!existing) return null;
  return d.delete({
    where: { id },
  });
}

export async function getResearcherJournalById(id: string, researcherId: string) {
  return getDelegate().findFirst({
    where: { id, researcherId },
  });
}

function buildWhere(researcherId: string, filters?: ResearcherJournalFilters) {
  const where: Prisma.JournalWhereInput = {
    researcherId,
  };
  if (filters?.role) {
    where.role = filters.role as any;
  }
  if (filters?.type) {
    where.type = filters.type as any;
  }
  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }
  if (filters?.year) {
    const startOfYear = new Date(filters.year, 0, 1);
    const endOfYear = new Date(filters.year, 11, 31, 23, 59, 59);
    where.startDate = {
      gte: startOfYear,
      lte: endOfYear,
    };
  }
  if (filters?.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listResearcherJournals(
  researcherId: string,
  filters?: ResearcherJournalFilters
) {
  const where = buildWhere(researcherId, filters);
  return getDelegate().findMany({
    where,
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
  });
}
