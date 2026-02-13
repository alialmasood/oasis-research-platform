import { prisma } from "@/lib/db";
import type { Prisma, ThankYouParticipationType } from "@prisma/client";

function getDelegate() {
  const delegate = (prisma as any).thankYouLetter;
  if (!delegate || typeof delegate.findMany !== "function") {
    throw new Error(
      "Prisma client لا يتضمن موديل كتب الشكر. أعد تشغيل خادم التطوير (dev server) ثم نفّذ: npx prisma generate"
    );
  }
  return delegate;
}

export type CreateResearcherThankYouLetterInput = {
  issuingOrganization: string;
  reason: string;
  date: Date;
  participationType?: ThankYouParticipationType | null;
  description?: string | null;
};

export type ResearcherThankYouLetterFilters = {
  search?: string;
  issuingOrganization?: string;
  participationType?: ThankYouParticipationType | string;
  year?: number;
};

export async function createResearcherThankYouLetter(
  researcherId: string,
  data: CreateResearcherThankYouLetterInput
) {
  const payload: any = {
    researcherId,
    issuingOrganization: data.issuingOrganization.trim(),
    reason: data.reason.trim(),
    date: data.date,
  };
  
  if (data.participationType !== undefined && data.participationType !== null) {
    payload.participationType = data.participationType as ThankYouParticipationType;
  } else {
    payload.participationType = null;
  }
  
  if (data.description) {
    payload.description = data.description.trim();
  } else {
    payload.description = null;
  }
  
  return getDelegate().create({
    data: payload,
  });
}

export async function updateResearcherThankYouLetter(
  id: string,
  researcherId: string,
  data: Partial<CreateResearcherThankYouLetterInput>
) {
  const existing = await getResearcherThankYouLetterById(id, researcherId);
  if (!existing) return null;
  const payload: Record<string, unknown> = {};
  if (data.issuingOrganization !== undefined) payload.issuingOrganization = data.issuingOrganization.trim();
  if (data.reason !== undefined) payload.reason = data.reason.trim();
  if (data.date !== undefined) payload.date = data.date;
  if (data.participationType !== undefined) payload.participationType = data.participationType ? (data.participationType as ThankYouParticipationType) : null;
  if (data.description !== undefined) payload.description = data.description?.trim() || null;
  if (Object.keys(payload).length === 0) return existing;
  return getDelegate().update({
    where: { id },
    data: payload,
  });
}

export async function deleteResearcherThankYouLetter(id: string, researcherId: string) {
  const d = getDelegate();
  const existing = await d.findFirst({
    where: { id, researcherId },
  });
  if (!existing) return null;
  return d.delete({
    where: { id },
  });
}

export async function getResearcherThankYouLetterById(id: string, researcherId: string) {
  return getDelegate().findFirst({
    where: { id, researcherId },
  });
}

function buildWhere(researcherId: string, filters?: ResearcherThankYouLetterFilters) {
  const where: Prisma.ThankYouLetterWhereInput = {
    researcherId,
  };
  if (filters?.issuingOrganization) {
    where.issuingOrganization = { contains: filters.issuingOrganization, mode: "insensitive" };
  }
  if (filters?.participationType) {
    where.participationType = filters.participationType as ThankYouParticipationType;
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
      { issuingOrganization: { contains: q, mode: "insensitive" } },
      { reason: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listResearcherThankYouLetters(
  researcherId: string,
  filters?: ResearcherThankYouLetterFilters
) {
  const where = buildWhere(researcherId, filters);
  return getDelegate().findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}
