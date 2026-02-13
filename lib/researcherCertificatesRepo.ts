import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

function getDelegate() {
  const delegate = (prisma as any).certificate;
  if (!delegate || typeof delegate.findMany !== "function") {
    throw new Error(
      "Prisma client لا يتضمن موديل الشهادات. أعد تشغيل خادم التطوير (dev server) ثم نفّذ: npx prisma generate"
    );
  }
  return delegate;
}

export type CreateResearcherCertificateInput = {
  title: string;
  issuingOrganization: string;
  date: Date; // يُخزن كأول يوم من الشهر
  description?: string | null;
};

export type ResearcherCertificateFilters = {
  search?: string;
  issuingOrganization?: string;
  year?: number;
  month?: number;
};

export async function createResearcherCertificate(
  researcherId: string,
  data: CreateResearcherCertificateInput
) {
  return getDelegate().create({
    data: {
      researcherId,
      title: data.title.trim(),
      issuingOrganization: data.issuingOrganization.trim(),
      date: data.date,
      description: data.description?.trim() || null,
    },
  });
}

export async function updateResearcherCertificate(
  id: string,
  researcherId: string,
  data: Partial<CreateResearcherCertificateInput>
) {
  const existing = await getResearcherCertificateById(id, researcherId);
  if (!existing) return null;
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.issuingOrganization !== undefined) payload.issuingOrganization = data.issuingOrganization.trim();
  if (data.date !== undefined) payload.date = data.date;
  if (data.description !== undefined) payload.description = data.description?.trim() || null;
  if (Object.keys(payload).length === 0) return existing;
  return getDelegate().update({
    where: { id },
    data: payload,
  });
}

export async function deleteResearcherCertificate(id: string, researcherId: string) {
  const d = getDelegate();
  const existing = await d.findFirst({
    where: { id, researcherId },
  });
  if (!existing) return null;
  return d.delete({
    where: { id },
  });
}

export async function getResearcherCertificateById(id: string, researcherId: string) {
  return getDelegate().findFirst({
    where: { id, researcherId },
  });
}

function buildWhere(researcherId: string, filters?: ResearcherCertificateFilters) {
  const where: Prisma.CertificateWhereInput = {
    researcherId,
  };
  if (filters?.issuingOrganization) {
    where.issuingOrganization = { contains: filters.issuingOrganization, mode: "insensitive" };
  }
  if (filters?.year) {
    const startOfYear = new Date(filters.year, 0, 1);
    const endOfYear = new Date(filters.year, 11, 31, 23, 59, 59);
    where.date = {
      gte: startOfYear,
      lte: endOfYear,
    };
  }
  if (filters?.month !== undefined && filters?.year) {
    const startOfMonth = new Date(filters.year, filters.month, 1);
    const endOfMonth = new Date(filters.year, filters.month + 1, 0, 23, 59, 59);
    where.date = {
      gte: startOfMonth,
      lte: endOfMonth,
    };
  }
  if (filters?.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { issuingOrganization: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listResearcherCertificates(
  researcherId: string,
  filters?: ResearcherCertificateFilters
) {
  const where = buildWhere(researcherId, filters);
  return getDelegate().findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}
