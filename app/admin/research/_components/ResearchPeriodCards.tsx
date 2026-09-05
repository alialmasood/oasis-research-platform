"use client";

import Link from "next/link";
import { Calendar, CalendarDays, GraduationCap, BookOpen } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { buildResearchListUrl, type AdminResearchSection } from "@/lib/admin/researchListUrl";
import { getPeriodOptions } from "@/lib/admin/researchPeriods";
import type { AdminResearchListFilters, AdminResearchPeriodCounts } from "@/lib/admin/researchTypes";

interface ResearchPeriodCardsProps {
  counts: AdminResearchPeriodCounts;
  filters: AdminResearchListFilters;
  section?: AdminResearchSection;
}

const periodIcons = {
  month: CalendarDays,
  year: Calendar,
  academic: GraduationCap,
  semester: BookOpen,
};

export function ResearchPeriodCards({ counts, filters, section = "overview" }: ResearchPeriodCardsProps) {
  const options = getPeriodOptions().filter((p) => p.id !== "all");

  const countMap: Record<string, number> = {
    month: counts.month,
    year: counts.year,
    academic: counts.academic,
    semester: counts.semester,
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {options.map((period) => {
        const Icon = periodIcons[period.id as keyof typeof periodIcons] ?? Calendar;
        const isActive = filters.period === period.id;
        const href = buildResearchListUrl(
          {
            ...filters,
            period: period.id,
            page: 1,
          },
          section
        );

        return (
          <Link
            key={period.id}
            href={href}
            className={cn(
              "rounded-xl border bg-white p-4 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5",
              isActive
                ? "border-[#2563EB] ring-2 ring-[#2563EB]/20"
                : "border-slate-100"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">{period.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 tabular-nums" dir="ltr">{period.description}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#2563EB]/10 flex-shrink-0">
                <Icon className="h-4 w-4 text-[#2563EB]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-3 tabular-nums" dir="ltr">
              {formatNumber(countMap[period.id] ?? 0)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">بحث في هذه الفترة</p>
          </Link>
        );
      })}
    </div>
  );
}
