import { prisma } from "@/lib/db";

export type ResearchStats = {
  totals: {
    total: number;
    completed: number;
    inProgress: number;
    published: number;
    unpublished: number;
    scopus: number;
    avgProgressInProgress: number; // 0..100
  };
  byYear: Array<{ year: number; count: number }>;
  byStatus: { completed: number; inProgress: number };
  byPublishStatus: { published: number; unpublished: number };
  byPublishType: {
    journal: number;
    conference: number;
    bookChapter: number;
    report: number;
    other: number;
  };
  byResearchType: { planned: number; unplanned: number };
  scopusQuartiles: { Q1: number; Q2: number; Q3: number; Q4: number };
  /** التصنيفات الموجودة فعلياً في البيانات */
  availableCategories: string[];
};

export async function getResearchStats(researcherId: string): Promise<ResearchStats> {
  const all = await prisma.research.findMany({
    where: { researcherId },
  });

  const total = all.length;
  const completed = all.filter((r) => r.status === "COMPLETED").length;
  const inProgress = all.filter((r) => r.status === "IN_PROGRESS").length;
  const published = all.filter((r) => r.publishStatus === "PUBLISHED").length;
  const unpublished = total - published;

  const inProgressItems = all.filter((r) => r.status === "IN_PROGRESS");
  const progressValues = inProgressItems
    .map((r) => r.progressPercent ?? 0)
    .filter((n) => n >= 0);
  const avgProgressInProgress =
    progressValues.length > 0
      ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
      : 0;

  const scopusItems = all.filter((r) => r.categories.includes("SCOPUS"));
  const scopus = scopusItems.length;

  // byYear: Array<{ year: number; count: number }>
  const byYearMap: Record<number, number> = {};
  for (const r of all) {
    byYearMap[r.year] = (byYearMap[r.year] ?? 0) + 1;
  }
  const byYear = Object.entries(byYearMap)
    .map(([year, count]) => ({ year: Number(year), count }))
    .sort((a, b) => a.year - b.year);

  // byPublishType: map enum values to camelCase keys
  const byPublishTypeMap: Record<string, number> = {};
  for (const r of all) {
    if (r.publishType) {
      let key = r.publishType.toLowerCase();
      // Convert BOOK_CHAPTER -> bookChapter, etc.
      if (key.includes("_")) {
        const parts = key.split("_");
        key = parts[0] + parts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
      }
      byPublishTypeMap[key] = (byPublishTypeMap[key] ?? 0) + 1;
    }
  }
  const byPublishType = {
    journal: byPublishTypeMap.journal ?? 0,
    conference: byPublishTypeMap.conference ?? 0,
    bookChapter: byPublishTypeMap.bookchapter ?? 0,
    report: byPublishTypeMap.report ?? 0,
    other: byPublishTypeMap.other ?? 0,
  };

  // byResearchType
  const byResearchTypeMap: Record<string, number> = {};
  for (const r of all) {
    const key = r.researchType.toLowerCase();
    byResearchTypeMap[key] = (byResearchTypeMap[key] ?? 0) + 1;
  }
  const byResearchType = {
    planned: byResearchTypeMap.planned ?? 0,
    unplanned: byResearchTypeMap.unplanned ?? 0,
  };

  // scopusQuartiles
  const scopusQuartiles = {
    Q1: scopusItems.filter((r) => r.scopusQuartile === "Q1").length,
    Q2: scopusItems.filter((r) => r.scopusQuartile === "Q2").length,
    Q3: scopusItems.filter((r) => r.scopusQuartile === "Q3").length,
    Q4: scopusItems.filter((r) => r.scopusQuartile === "Q4").length,
  };

  // التصنيفات الموجودة فعلياً (من كل البحوث)
  const availableCategories = Array.from(
    new Set(all.flatMap((r) => r.categories))
  ).sort();

  return {
    totals: {
      total,
      completed,
      inProgress,
      published,
      unpublished,
      scopus,
      avgProgressInProgress,
    },
    byYear,
    byStatus: { completed, inProgress },
    byPublishStatus: { published, unpublished },
    byPublishType,
    byResearchType,
    scopusQuartiles,
    availableCategories,
  };
}
