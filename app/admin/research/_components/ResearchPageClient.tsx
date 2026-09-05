"use client";

import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { ResearchPeriodCards } from "./ResearchPeriodCards";
import { ResearchStatsCards, INTERNATIONAL_STATS_HIDDEN } from "./ResearchStatsCards";
import { ResearchTable } from "./ResearchTable";
import { ResearchListFiltersCard } from "./ResearchListFiltersCard";
import { ResearchChartsSection } from "@/app/researcher/activities/research/_components/ResearchChartsSection";
import { ADMIN_RESEARCH_SECTIONS, type AdminResearchSection } from "@/lib/admin/researchListUrl";
import { formatNumber } from "@/lib/utils";
import type { AdminResearchPageData } from "@/lib/admin/researchTypes";
import { useResearchListFilters } from "./useResearchListFilters";

interface ResearchPageClientProps {
  data: AdminResearchPageData;
  section?: AdminResearchSection;
}

export function ResearchPageClient({ data, section = "overview" }: ResearchPageClientProps) {
  const sectionMeta = ADMIN_RESEARCH_SECTIONS[section];
  const filtersHook = useResearchListFilters(data, section);
  const { isPending, fixedCategory } = filtersHook;

  const isInternational = section === "international";

  const hasNonPeriodFilters =
    data.filters.search.trim() !== "" ||
    (!isInternational && !!data.filters.status) ||
    (!isInternational && !!data.filters.publishStatus) ||
    !!data.filters.researchType ||
    !!data.filters.year ||
    !!data.filters.entity ||
    (!fixedCategory && !!data.filters.category) ||
    !!data.filters.publishType ||
    !!data.filters.scopusQuartile;

  return (
    <div className={`space-y-6 ${isPending ? "opacity-70 pointer-events-none" : ""}`}>
      <AdminPageHeader title={sectionMeta.title} description={sectionMeta.description} />

      <ResearchStatsCards
        stats={data.stats}
        hiddenKeys={isInternational ? INTERNATIONAL_STATS_HIDDEN : undefined}
      />

      {hasNonPeriodFilters || data.filters.period !== "all" ? (
        <p className="text-xs text-slate-500 -mt-4">
          المؤشرات والرسوم تعكس الفلاتر النشطة ({formatNumber(data.pagination.totalCount)} بحث)
        </p>
      ) : null}

      <ResearchChartsSection
        stats={data.chartStats}
        hiddenCharts={["completedVsInProgress", "publishedVsUnpublished", "plannedVsUnplanned"]}
      />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">النشاط البحثي حسب الفترة</h2>
          {data.filters.period !== "all" && (
            <span className="text-xs text-[#2563EB] bg-[#2563EB]/10 px-2 py-1 rounded-md">
              عرض: {data.periodLabel}
            </span>
          )}
        </div>
        <ResearchPeriodCards counts={data.periodCounts} filters={data.filters} section={section} />
      </div>

      <ResearchListFiltersCard
        data={data}
        section={section}
        filtersHook={filtersHook}
        options={{
          hideStatus: isInternational,
          hidePublishStatus: isInternational,
          hideCategory: isInternational,
          fullWidth: true,
        }}
      />

      <ResearchTable
        items={data.items}
        rowOffset={data.pagination.rowOffset}
        pagination={data.pagination}
        filters={data.filters}
        section={section}
      />
    </div>
  );
}
