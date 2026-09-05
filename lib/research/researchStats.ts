import { prisma } from "@/lib/db";

export type ResearchRecordForStats = {
  status: string;
  publishStatus: string | null;
  publishType: string | null;
  researchType: string;
  ownership: string;
  categories: string[];
  progressPercent: number | null;
  year: number;
  scopusQuartile: string | null;
};

export type ResearchStats = {
  totals: {
    total: number;
    completed: number;
    inProgress: number;
    published: number;
    unpublished: number;
    scopus: number;
    avgProgressInProgress: number;
    planned: number;
    unplanned: number;
    international: number;
    local: number;
    individual: number;
    isi: number;
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
  availableCategories: string[];
};

export function computeResearchStatsFromRecords(
  all: ResearchRecordForStats[]
): ResearchStats {
  const total = all.length;
  const completed = all.filter((r) => r.status === "COMPLETED").length;
  const inProgress = all.filter((r) => r.status === "IN_PROGRESS").length;
  const published = all.filter((r) => r.publishStatus === "PUBLISHED").length;
  const unpublished = total - published;
  const planned = all.filter((r) => r.researchType === "PLANNED").length;
  const unplanned = all.filter((r) => r.researchType === "UNPLANNED").length;
  const international = all.filter((r) => r.categories.includes("INTERNATIONAL")).length;
  const local = all.filter((r) => r.categories.includes("LOCAL")).length;
  const individual = all.filter((r) => r.ownership === "INDIVIDUAL").length;
  const isi = all.filter((r) => r.categories.includes("ISI")).length;

  const progressValues = all
    .filter((r) => r.status === "IN_PROGRESS")
    .map((r) => r.progressPercent ?? 0)
    .filter((n) => n >= 0);
  const avgProgressInProgress =
    progressValues.length > 0
      ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
      : 0;

  const scopusItems = all.filter((r) => r.categories.includes("SCOPUS"));
  const scopus = scopusItems.length;

  const byYearMap: Record<number, number> = {};
  for (const r of all) {
    byYearMap[r.year] = (byYearMap[r.year] ?? 0) + 1;
  }
  const byYear = Object.entries(byYearMap)
    .map(([year, count]) => ({ year: Number(year), count }))
    .sort((a, b) => a.year - b.year);

  const byPublishTypeMap: Record<string, number> = {};
  for (const r of all) {
    if (r.publishType) {
      let key = r.publishType.toLowerCase();
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

  const scopusQuartiles = {
    Q1: scopusItems.filter((r) => r.scopusQuartile === "Q1").length,
    Q2: scopusItems.filter((r) => r.scopusQuartile === "Q2").length,
    Q3: scopusItems.filter((r) => r.scopusQuartile === "Q3").length,
    Q4: scopusItems.filter((r) => r.scopusQuartile === "Q4").length,
  };

  const availableCategories = Array.from(new Set(all.flatMap((r) => r.categories))).sort();

  return {
    totals: {
      total,
      completed,
      inProgress,
      published,
      unpublished,
      scopus,
      avgProgressInProgress,
      planned,
      unplanned,
      international,
      local,
      individual,
      isi,
    },
    byYear,
    byStatus: { completed, inProgress },
    byPublishStatus: { published, unpublished },
    byPublishType,
    byResearchType: { planned, unplanned },
    scopusQuartiles,
    availableCategories,
  };
}

export async function getResearchStats(researcherId: string): Promise<ResearchStats> {
  const all = await prisma.research.findMany({
    where: { researcherId },
  });

  return computeResearchStatsFromRecords(all);
}

/** أقوى تصنيف فهرسة للباحث (SCOPUS Q1 > Q2 > Q3 > Q4 > ISI > عالمي > محلي) */
export function getTopResearchIndexing(stats: ResearchStats): string {
  const { scopusQuartiles, availableCategories } = stats;
  if (scopusQuartiles.Q1 > 0) return "SCOPUS Q1";
  if (scopusQuartiles.Q2 > 0) return "SCOPUS Q2";
  if (scopusQuartiles.Q3 > 0) return "SCOPUS Q3";
  if (scopusQuartiles.Q4 > 0) return "SCOPUS Q4";
  if (availableCategories.includes("ISI")) return "ISI (Web of Science)";
  if (availableCategories.includes("INTERNATIONAL")) return "عالمي";
  if (availableCategories.includes("LOCAL")) return "محلي";
  if (availableCategories.includes("SCOPUS")) return "SCOPUS";
  return "—";
}
