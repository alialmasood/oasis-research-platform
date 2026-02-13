import { prisma } from "@/lib/db";
import type { Prisma, ResearchStatus, PublishStatus } from "@prisma/client";
import type { CreateResearchInput, ResearchFilters, ListResearchOptions } from "@/app/researcher/activities/research/schema";

const defaultPageSize = 10;

export async function createResearch(researcherId: string, data: CreateResearchInput) {
  const payload = {
    researcherId,
    title: data.title,
    researchType: data.researchType as "PLANNED" | "UNPLANNED",
    ownership: data.ownership as "INDIVIDUAL" | "TEAM" | "INSTITUTIONAL",
    status: data.status as ResearchStatus,
    progressPercent: data.progressPercent ?? null,
    year: data.year,
    publishStatus: data.publishStatus as PublishStatus | null ?? null,
    researchUrl: data.researchUrl?.trim() || null,
    publishType: data.publishType ?? null,
    publisher: data.publisher?.trim() || null,
    doi: data.doi?.trim() || null,
    publishMonth: data.publishMonth ?? null,
    downloadUrl: data.downloadUrl?.trim() || null,
    categories: data.categories || [], // تأكد من أن categories array (حتى لو فارغ)
    scopusQuartile: data.scopusQuartile ?? null,
  };
  return prisma.research.create({
    data: payload,
  });
}

export async function updateResearch(
  id: string,
  researcherId: string,
  data: Partial<CreateResearchInput>
) {
  const existing = await prisma.research.findFirst({
    where: { id, researcherId },
  });
  if (!existing) return null;

  const payload: Parameters<typeof prisma.research.update>[0]["data"] = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.researchType !== undefined) payload.researchType = data.researchType as any;
  if (data.ownership !== undefined) payload.ownership = data.ownership as any;
  if (data.status !== undefined) payload.status = data.status as any;
  if (data.progressPercent !== undefined) payload.progressPercent = data.progressPercent;
  if (data.year !== undefined) payload.year = data.year;
  if (data.publishStatus !== undefined) payload.publishStatus = data.publishStatus as any;
  if (data.researchUrl !== undefined) payload.researchUrl = data.researchUrl?.trim() || null;
  if (data.publishType !== undefined) payload.publishType = data.publishType as any;
  if (data.publisher !== undefined) payload.publisher = data.publisher?.trim() || null;
  if (data.doi !== undefined) payload.doi = data.doi?.trim() || null;
  if (data.publishMonth !== undefined) payload.publishMonth = data.publishMonth;
  if (data.downloadUrl !== undefined) payload.downloadUrl = data.downloadUrl?.trim() || null;
  if (data.categories !== undefined) payload.categories = data.categories;
  if (data.scopusQuartile !== undefined) payload.scopusQuartile = data.scopusQuartile as any;

  return prisma.research.update({
    where: { id },
    data: payload,
  });
}

export async function deleteResearch(id: string, researcherId: string) {
  const existing = await prisma.research.findFirst({
    where: { id, researcherId },
  });
  if (!existing) return null;
  return prisma.research.delete({
    where: { id },
  });
}

export async function getResearchById(id: string, researcherId: string) {
  return prisma.research.findFirst({
    where: { id, researcherId },
  });
}

function buildWhere(researcherId: string, filters?: ResearchFilters) {
  const where: Prisma.ResearchWhereInput = {
    researcherId,
  };
  if (filters?.status) where.status = filters.status as ResearchStatus;
  if (filters?.publishStatus) {
    if (filters.publishStatus === "DRAFT") {
      where.OR = [{ publishStatus: "DRAFT" }, { publishStatus: null }];
    } else {
      where.publishStatus = filters.publishStatus as PublishStatus;
    }
  }
  if (filters?.researchType) where.researchType = filters.researchType as any;
  if (filters?.year != null) where.year = filters.year;
  if (filters?.category) {
    where.categories = { has: filters.category };
  }
  if (filters?.publishType) {
    where.publishType = filters.publishType as any;
  }
  if (filters?.scopusQuartile) {
    where.scopusQuartile = filters.scopusQuartile as any;
  }
  if (filters?.search) {
    where.title = { contains: filters.search, mode: "insensitive" };
  }
  return where;
}

export async function listResearch(options: ListResearchOptions) {
  const { researcherId, filters, page = 1, pageSize = defaultPageSize } = options;
  const where = buildWhere(researcherId, filters);
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.research.findMany({
      where,
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.research.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function listAllResearchForResearcher(researcherId: string) {
  return prisma.research.findMany({
    where: { researcherId },
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
  });
}

export async function listAllResearch(
  researcherId: string,
  filters?: ResearchFilters
) {
  const where = buildWhere(researcherId, filters);
  return prisma.research.findMany({
    where,
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
  });
}
