"use client";

import {
  Building2,
  Layers,
  TrendingDown,
  BookOpen,
  Database,
  CalendarRange,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";
import type { AdminResearcherOrgInsight } from "@/lib/admin/researchTypes";

const insightIcons = {
  entity_most_no_research: Building2,
  department_most_no_research: Layers,
  entity_fewest_scopus_publishers: Database,
  department_fewest_scopus_publishers: Database,
  entity_least_academic_activity: CalendarRange,
  department_least_academic_activity: CalendarRange,
} as const;

const insightStyles = {
  entity_most_no_research: {
    border: "border-r-amber-500",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  department_most_no_research: {
    border: "border-r-orange-500",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  entity_fewest_scopus_publishers: {
    border: "border-r-cyan-500",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  department_fewest_scopus_publishers: {
    border: "border-r-teal-500",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
  },
  entity_least_academic_activity: {
    border: "border-r-indigo-500",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  department_least_academic_activity: {
    border: "border-r-violet-500",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
} as const;

function getCountSuffix(insight: AdminResearcherOrgInsight): string {
  switch (insight.id) {
    case "entity_most_no_research":
    case "department_most_no_research":
      return "تدريسي بلا بحوث";
    case "entity_fewest_scopus_publishers":
    case "department_fewest_scopus_publishers":
      return "ينشرون SCOPUS";
    case "entity_least_academic_activity":
    case "department_least_academic_activity":
      return "بنشاط بحثي";
  }
}

function InsightCountLine({ insight }: { insight: AdminResearcherOrgInsight }) {
  return (
    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
      <span className="tabular-nums" dir="ltr">
        {formatNumber(insight.count)}
      </span>{" "}
      {getCountSuffix(insight)}
      {" · من "}
      <span className="tabular-nums" dir="ltr">
        {formatNumber(insight.totalInGroup)}
      </span>
    </p>
  );
}

interface ResearchOrgInsightCardsProps {
  insights: AdminResearcherOrgInsight[];
}

export function ResearchOrgInsightCards({ insights }: ResearchOrgInsightCardsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingDown className="h-4 w-4 text-[#2563EB]" />
        <h2 className="text-sm font-semibold text-slate-800">مؤشرات التشكيلات والأقسام</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight) => {
          const Icon = insightIcons[insight.id] ?? BookOpen;
          const styles = insightStyles[insight.id];
          const hasData = insight.groupName !== "—" && insight.totalInGroup > 0;

          return (
            <Card
              key={insight.id}
              className={cn(
                "border border-slate-100 bg-white shadow-lg border-r-4 min-h-[132px]",
                styles.border
              )}
            >
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={cn("p-2 rounded-lg shrink-0", styles.iconBg)}>
                    <Icon className={cn("h-4 w-4", styles.iconColor)} />
                  </div>
                  {hasData && insight.totalInGroup > 0 && (
                    <span className="text-[11px] text-slate-400 tabular-nums" dir="ltr">
                      {formatNumber(
                        Math.round((insight.count / insight.totalInGroup) * 100)
                      )}
                      %
                    </span>
                  )}
                </div>

                <h3 className="text-xs font-semibold text-slate-700 leading-snug">{insight.title}</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{insight.description}</p>

                <p className="text-base font-bold text-slate-900 mt-auto pt-3 leading-snug line-clamp-2">
                  {insight.groupName}
                </p>

                {hasData ? (
                  <InsightCountLine insight={insight} />
                ) : (
                  <p className="text-xs text-slate-400 mt-1">لا توجد بيانات كافية</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
