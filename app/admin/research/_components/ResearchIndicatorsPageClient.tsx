"use client";

import { FileX, Database, GraduationCap, Users, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { ResearchResearcherGapTables } from "./ResearchResearcherGapTables";
import { ResearchOrgInsightCards } from "./ResearchOrgInsightCards";
import type { AdminResearcherIndicatorsPageData } from "@/lib/admin/researchTypes";

const gapIcons = {
  no_research: BookOpen,
  no_scopus: Database,
  no_academic_activity: GraduationCap,
} as const;

const gapStyles = {
  no_research: {
    border: "border-r-amber-500",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  no_scopus: {
    border: "border-r-cyan-500",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  no_academic_activity: {
    border: "border-r-indigo-500",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
} as const;

interface ResearchIndicatorsPageClientProps {
  data: AdminResearcherIndicatorsPageData;
}

export function ResearchIndicatorsPageClient({ data }: ResearchIndicatorsPageClientProps) {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="مؤشرات الباحثين"
        description="تدريسيون نشطون بلا نشاط بحثي في معايير محددة — على مستوى الجامعة"
      />

      <Card className="border-slate-100 bg-white shadow-lg border-r-4 border-r-[#2563EB]">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#2563EB]/10">
              <Users className="h-5 w-5 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">إجمالي التدريسيين النشطين</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums" dir="ltr">
                {formatNumber(data.totalResearchers)}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            العام الدراسي الحالي:{" "}
            <span className="font-medium tabular-nums" dir="ltr">
              {data.academicYearLabel}
            </span>
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {data.metrics.map((metric) => {
          const Icon = gapIcons[metric.id] ?? FileX;
          const styles = gapStyles[metric.id];
          const pct =
            metric.totalResearchers > 0
              ? Math.round((metric.count / metric.totalResearchers) * 100)
              : 0;

          return (
            <Card
              key={metric.id}
              className={cn(
                "border border-slate-100 bg-white shadow-lg border-r-4",
                styles.border
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={cn("p-2 rounded-lg", styles.iconBg)}>
                    <Icon className={cn("h-4 w-4", styles.iconColor)} />
                  </div>
                  <span className="text-xs text-slate-400 tabular-nums" dir="ltr">
                    {formatNumber(pct)}%
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{metric.label}</h3>
                <p className="text-xs text-slate-500 mt-1">{metric.description}</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums mt-2" dir="ltr">
                  {formatNumber(metric.count)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ResearchOrgInsightCards insights={data.orgInsights} />

      <ResearchResearcherGapTables
        tables={data.tables}
        totalResearchers={data.totalResearchers}
        academicYearLabel={data.academicYearLabel}
      />
    </div>
  );
}
