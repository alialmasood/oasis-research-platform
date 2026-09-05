"use client";

import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ResearchExportBar } from "./ResearchExportBar";
import {
  RESEARCH_STATUS_LABELS,
  PUBLISH_STATUS_LABELS,
  PUBLISH_TYPE_LABELS,
  SCOPUS_QUARTILE_LABELS,
  RESEARCH_TYPE_LABELS,
  type AdminResearchPageData,
} from "@/lib/admin/researchTypes";
import { getPeriodOptions } from "@/lib/admin/researchPeriods";
import { cn, formatNumber } from "@/lib/utils";
import type { AdminResearchSection } from "@/lib/admin/researchListUrl";
import { useResearchListFilters } from "./useResearchListFilters";

const ALL = "__all__";

type ResearchFiltersHook = ReturnType<typeof useResearchListFilters>;

interface ResearchListFiltersCardProps {
  data: AdminResearchPageData;
  section: AdminResearchSection;
  filtersHook: ResearchFiltersHook;
  options?: {
    hidePeriod?: boolean;
    hideCategory?: boolean;
    hideResearchType?: boolean;
    hideStatus?: boolean;
    hidePublishStatus?: boolean;
    fullWidth?: boolean;
  };
}

export function ResearchListFiltersCard({
  data,
  section,
  filtersHook,
  options = {},
}: ResearchListFiltersCardProps) {
  const {
    searchInput,
    setSearchInput,
    navigate,
    hasActiveFilters,
    resetFilters,
    fixedCategory,
  } = filtersHook;

  const periodOptions = getPeriodOptions();
  const {
    hidePeriod = false,
    hideCategory = false,
    hideResearchType = false,
    hideStatus = false,
    hidePublishStatus = false,
    fullWidth = false,
  } = options;

  return (
    <Card className="border-slate-100 bg-white shadow-lg">
      <CardContent className="py-3 px-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Filter className="h-4 w-4 text-[#2563EB]" />
              <span className="text-sm font-medium">البحث والتصفية</span>
            </div>
            <ResearchExportBar filters={data.filters} totalCount={data.pagination.totalCount} />
          </div>
          <div
            className={cn(
              "flex flex-nowrap items-center gap-2 w-full",
              !fullWidth && "overflow-x-auto"
            )}
          >
            <div
              className={cn(
                "relative min-w-0",
                fullWidth ? "flex-[2] shrink" : "flex-[2] min-w-[160px] max-w-[280px]"
              )}
            >
              <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="عنوان، باحث، DOI، الناشر..."
                className="h-9 pr-9 text-sm border-slate-200 focus:border-[#2563EB] focus:ring-[#2563EB]/20"
              />
            </div>

            {!hidePeriod && (
              <div
                className={cn(
                  "min-w-0",
                  fullWidth ? "flex-1 shrink" : "min-w-[110px] flex-1 max-w-[130px]"
                )}
              >
                <Select
                  value={data.filters.period || "all"}
                  onValueChange={(value) =>
                    navigate({ period: value as typeof data.filters.period, page: 1 })
                  }
                >
                  <SelectTrigger className="h-9 w-full border-slate-200 text-sm">
                    <SelectValue placeholder="الفترة" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <FilterSelect
              label="السنة"
              value={data.filters.year || ALL}
              allLabel="كل السنوات"
              options={Object.fromEntries(data.years.map((y) => [String(y), String(y)]))}
              onChange={(v) => navigate({ year: v, page: 1 })}
              fullWidth={fullWidth}
            />

            <FilterSelect
              label="التشكيل"
              value={data.filters.entity || ALL}
              allLabel="كل التشكيلات"
              options={Object.fromEntries(data.entities.map((e) => [e, e]))}
              onChange={(v) => navigate({ entity: v, page: 1 })}
              fullWidth={fullWidth}
            />

            {!hideResearchType && (
              <FilterSelect
                label="النوع"
                value={data.filters.researchType || ALL}
                allLabel="كل الأنواع"
                options={RESEARCH_TYPE_LABELS}
                onChange={(v) => navigate({ researchType: v, page: 1 })}
                fullWidth={fullWidth}
              />
            )}

            {!hideStatus && (
              <FilterSelect
                label="الحالة"
                value={data.filters.status || ALL}
                allLabel="كل الحالات"
                options={RESEARCH_STATUS_LABELS}
                onChange={(v) => navigate({ status: v, page: 1 })}
                fullWidth={fullWidth}
              />
            )}

            {!hidePublishStatus && (
              <FilterSelect
                label="النشر"
                value={data.filters.publishStatus || ALL}
                allLabel="كل حالات النشر"
                options={PUBLISH_STATUS_LABELS}
                onChange={(v) => navigate({ publishStatus: v, page: 1 })}
                fullWidth={fullWidth}
              />
            )}

            {!hideCategory &&
              (fixedCategory ? (
                <div className="h-9 min-w-[90px] flex items-center px-2 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-600 shrink-0">
                  SCOPUS
                </div>
              ) : (
                <FilterSelect
                  label="التصنيف"
                  value={data.filters.category || ALL}
                  allLabel="كل التصنيفات"
                  options={{
                    SCOPUS: "SCOPUS",
                    ISI: "ISI",
                    LOCAL: "محلي",
                    INTERNATIONAL: "عالمي",
                  }}
                  onChange={(v) => navigate({ category: v, page: 1 })}
                  fullWidth={fullWidth}
                />
              ))}

            <FilterSelect
              label="نوع النشر"
              value={data.filters.publishType || ALL}
              allLabel="كل أنواع النشر"
              options={PUBLISH_TYPE_LABELS}
              onChange={(v) => navigate({ publishType: v, page: 1 })}
              fullWidth={fullWidth}
            />

            <FilterSelect
              label="الربع"
              value={data.filters.scopusQuartile || ALL}
              allLabel="كل الأرباع"
              options={SCOPUS_QUARTILE_LABELS}
              onChange={(v) => navigate({ scopusQuartile: v, page: 1 })}
              fullWidth={fullWidth}
            />

            <div className="flex items-center gap-2 shrink-0">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-9 shrink-0 text-slate-500 hover:text-slate-800 px-2"
                >
                  <X className="h-4 w-4 ml-1" />
                  <span className="whitespace-nowrap">مسح</span>
                </Button>
              )}

              <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums" dir="ltr">
                {formatNumber(data.pagination.totalCount)} بحث
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  value,
  allLabel,
  options,
  onChange,
  fullWidth = false,
}: {
  label: string;
  value: string;
  allLabel: string;
  options: Record<string, string>;
  onChange: (value: string) => void;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0",
        fullWidth ? "flex-1 min-w-0 shrink" : "min-w-[100px] flex-1 max-w-[120px]"
      )}
    >
      <Select
        value={value}
        onValueChange={(v) => onChange(v === ALL ? "" : v)}
      >
        <SelectTrigger className="h-9 w-full border-slate-200 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {Object.entries(options).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
