import type { ResearchStats } from "@/lib/research/researchStats";
import { computeResearchStatsFromRecords } from "@/lib/research/researchStats";
import type { AdminResearchStats } from "./researchTypes";

export type UniversityResearchStatsRow = {
  id: string;
  status: string;
  publishStatus: string | null;
  publishType: string | null;
  researchType: string;
  ownership: string;
  categories: string[];
  progressPercent: number | null;
  year: number;
  publishMonth: number | null;
  scopusQuartile: string | null;
  createdAt: Date;
  researcherId: string;
};

export function computeUniversityResearchStats(
  rows: UniversityResearchStatsRow[]
): { stats: AdminResearchStats; chartStats: ResearchStats } {
  const chartStats = computeResearchStatsFromRecords(rows);
  const t = chartStats.totals;
  const researchersWithResearch = new Set(rows.map((r) => r.researcherId)).size;

  return {
    stats: {
      total: t.total,
      planned: t.planned,
      unplanned: t.unplanned,
      completed: t.completed,
      inProgress: t.inProgress,
      published: t.published,
      unpublished: t.unpublished,
      international: t.international,
      local: t.local,
      individual: t.individual,
      scopus: t.scopus,
      isi: t.isi,
      avgProgressInProgress: t.avgProgressInProgress,
      researchersWithResearch,
    },
    chartStats,
  };
}
