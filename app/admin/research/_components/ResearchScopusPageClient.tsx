"use client";

import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { ADMIN_RESEARCH_SECTIONS } from "@/lib/admin/researchListUrl";
import { formatNumber } from "@/lib/utils";
import type { AdminResearchPageData } from "@/lib/admin/researchTypes";
import { ResearchScopusStatsCards } from "./ResearchScopusStatsCards";
import { ResearchScopusChartsSection } from "./ResearchScopusChartsSection";
import { ResearchListFiltersCard } from "./ResearchListFiltersCard";
import { ResearchTable } from "./ResearchTable";
import { useResearchListFilters } from "./useResearchListFilters";

interface ResearchScopusPageClientProps {
  data: AdminResearchPageData;
}

export function ResearchScopusPageClient({ data }: ResearchScopusPageClientProps) {
  const sectionMeta = ADMIN_RESEARCH_SECTIONS.scopus;
  const filtersHook = useResearchListFilters(data, "scopus");
  const { isPending } = filtersHook;

  const hasExtraFilters =
    data.filters.search.trim() !== "" ||
    !!data.filters.year ||
    !!data.filters.entity ||
    !!data.filters.publishType ||
    !!data.filters.scopusQuartile;

  return (
    <div className={`space-y-6 ${isPending ? "opacity-70 pointer-events-none" : ""}`}>
      <AdminPageHeader title={sectionMeta.title} description={sectionMeta.description} />

      <ResearchScopusStatsCards stats={data.stats} chartStats={data.chartStats} />

      {hasExtraFilters && (
        <p className="text-xs text-slate-500 -mt-2">
          المؤشرات والتحليلات تعكس الفلاتر النشطة ({formatNumber(data.pagination.totalCount)} بحث
          SCOPUS)
        </p>
      )}

      <ResearchScopusChartsSection stats={data.chartStats} />

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">سجل بحوث SCOPUS</h2>
        <ResearchListFiltersCard
          data={data}
          section="scopus"
          filtersHook={filtersHook}
          options={{
            hidePeriod: true,
            hideCategory: true,
            hideResearchType: true,
            hideStatus: true,
            hidePublishStatus: true,
            fullWidth: true,
          }}
        />
      </div>

      <ResearchTable
        items={data.items}
        rowOffset={data.pagination.rowOffset}
        pagination={data.pagination}
        filters={data.filters}
        section="scopus"
        variant="scopus"
      />
    </div>
  );
}
