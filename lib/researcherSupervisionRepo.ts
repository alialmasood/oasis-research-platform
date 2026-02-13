import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

function getDelegate() {
  const delegate = (prisma as any).supervision;
  if (!delegate || typeof delegate.findMany !== "function") {
    throw new Error(
      "Prisma client لا يتضمن موديل الإشراف. أعد تشغيل خادم التطوير (dev server) ثم نفّذ: npx prisma generate"
    );
  }
  return delegate;
}

export type CreateResearcherSupervisionInput = {
  studentName: string;
  degreeType: "PHD" | "MASTERS" | "BACHELORS" | "HIGHER_DIPLOMA";
  thesisTitle: string;
  startDate: Date;
  endDate?: Date | null;
  status: "COMPLETED" | "IN_PROGRESS";
  supervisionType?: "SOLE" | "JOINT" | null;
  description?: string | null;
};

export type ResearcherSupervisionFilters = {
  search?: string;
  degreeType?: string;
  status?: string;
  supervisionType?: string;
  year?: number;
};

export async function createResearcherSupervision(
  researcherId: string,
  data: CreateResearcherSupervisionInput
) {
  return getDelegate().create({
    data: {
      researcherId,
      studentName: data.studentName.trim(),
      degreeType: data.degreeType,
      thesisTitle: data.thesisTitle.trim(),
      startDate: data.startDate,
      endDate: data.status === "COMPLETED" ? (data.endDate || null) : null,
      status: data.status,
      supervisionType: data.supervisionType || null,
      description: data.description?.trim() || null,
    },
  });
}

export async function updateResearcherSupervision(
  id: string,
  researcherId: string,
  data: Partial<CreateResearcherSupervisionInput>
) {
  const existing = await getResearcherSupervisionById(id, researcherId);
  if (!existing) return null;
  const payload: Record<string, unknown> = {};
  if (data.studentName !== undefined) payload.studentName = data.studentName.trim();
  if (data.degreeType !== undefined) payload.degreeType = data.degreeType;
  if (data.thesisTitle !== undefined) payload.thesisTitle = data.thesisTitle.trim();
  if (data.startDate !== undefined) payload.startDate = data.startDate;
  if (data.status !== undefined) {
    payload.status = data.status;
    if (data.status === "COMPLETED") {
      payload.endDate = data.endDate || null;
    } else {
      payload.endDate = null;
    }
  } else if (data.endDate !== undefined) {
    payload.endDate = data.endDate;
  }
  if (data.supervisionType !== undefined) payload.supervisionType = data.supervisionType || null;
  if (data.description !== undefined) payload.description = data.description?.trim() || null;
  if (Object.keys(payload).length === 0) return existing;
  return getDelegate().update({
    where: { id },
    data: payload,
  });
}

export async function deleteResearcherSupervision(id: string, researcherId: string) {
  const d = getDelegate();
  const existing = await d.findFirst({
    where: { id, researcherId },
  });
  if (!existing) return null;
  return d.delete({
    where: { id },
  });
}

export async function getResearcherSupervisionById(id: string, researcherId: string) {
  return getDelegate().findFirst({
    where: { id, researcherId },
  });
}

function buildWhere(researcherId: string, filters?: ResearcherSupervisionFilters) {
  const where: Prisma.SupervisionWhereInput = {
    researcherId,
  };
  if (filters?.degreeType) {
    where.degreeType = filters.degreeType as any;
  }
  if (filters?.status) {
    where.status = filters.status as any;
  }
  if (filters?.supervisionType) {
    where.supervisionType = filters.supervisionType as any;
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
      { studentName: { contains: q, mode: "insensitive" } },
      { thesisTitle: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listResearcherSupervisions(
  researcherId: string,
  filters?: ResearcherSupervisionFilters
) {
  const where = buildWhere(researcherId, filters);
  return getDelegate().findMany({
    where,
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
  });
}
