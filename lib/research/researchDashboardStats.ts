import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type ResearchSummaryStats = {
  total: number;
  planned: number;
  completed: number;
  published: number;
  incomplete: number;
  international: number;
  local: number;
  individual: number;
  scopus: number;
  thomson: number;
};

export function emptyResearchSummaryStats(): ResearchSummaryStats {
  return {
    total: 0,
    planned: 0,
    completed: 0,
    published: 0,
    incomplete: 0,
    international: 0,
    local: 0,
    individual: 0,
    scopus: 0,
    thomson: 0,
  };
}

function computeResearchSummary(
  items: Array<{
    researchType: string;
    status: string;
    publishStatus: string | null;
    ownership: string;
    categories: string[];
  }>
): ResearchSummaryStats {
  const total = items.length;
  const planned = items.filter((r) => r.researchType === "PLANNED").length;
  const completed = items.filter((r) => r.status === "COMPLETED").length;
  const published = items.filter((r) => r.publishStatus === "PUBLISHED").length;
  const incomplete = total - completed;
  const international = items.filter((r) => r.categories.includes("INTERNATIONAL")).length;
  const local = items.filter((r) => r.categories.includes("LOCAL")).length;
  const individual = items.filter((r) => r.ownership === "INDIVIDUAL").length;
  const scopus = items.filter((r) => r.categories.includes("SCOPUS")).length;
  const thomson = items.filter((r) => r.categories.includes("ISI")).length;

  return {
    total,
    planned,
    completed,
    published,
    incomplete,
    international,
    local,
    individual,
    scopus,
    thomson,
  };
}

export async function getResearchSummaryStats(
  researcherId: string,
  filters?: { year?: number; month?: number }
): Promise<ResearchSummaryStats> {
  const where: Prisma.ResearchWhereInput = {
    researcherId,
  };

  if (filters?.year != null) {
    where.year = filters.year;
  }

  if (filters?.month != null) {
    where.publishMonth = filters.month;
  }

  const items = await prisma.research.findMany({
    where,
    select: {
      researchType: true,
      status: true,
      publishStatus: true,
      ownership: true,
      categories: true,
    },
  });

  return computeResearchSummary(items);
}
