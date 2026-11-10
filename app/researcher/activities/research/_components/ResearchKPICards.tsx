"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  CheckCircle2,
  Loader2,
  FileEdit,
  Database,
  Percent,
} from "lucide-react";
import type { ResearchStats } from "@/lib/research/researchStats";

const kpis: Array<{
  key: keyof ResearchStats["totals"];
  label: string;
  shortLabel: string;
  icon: typeof BookOpen;
  color: string;
  softBg: string;
  softText: string;
  format?: (v: number) => string;
}> = [
  {
    key: "total",
    label: "إجمالي البحوث",
    shortLabel: "الإجمالي",
    icon: BookOpen,
    color: "bg-blue-500",
    softBg: "bg-blue-50",
    softText: "text-blue-600",
  },
  {
    key: "completed",
    label: "منجز",
    shortLabel: "منجز",
    icon: CheckCircle2,
    color: "bg-green-500",
    softBg: "bg-green-50",
    softText: "text-green-600",
  },
  {
    key: "inProgress",
    label: "غير منجز",
    shortLabel: "غير منجز",
    icon: Loader2,
    color: "bg-amber-500",
    softBg: "bg-amber-50",
    softText: "text-amber-600",
  },
  {
    key: "published",
    label: "منشور",
    shortLabel: "منشور",
    icon: FileEdit,
    color: "bg-purple-500",
    softBg: "bg-purple-50",
    softText: "text-purple-600",
  },
  {
    key: "scopus",
    label: "سكوبس",
    shortLabel: "سكوبس",
    icon: Database,
    color: "bg-cyan-500",
    softBg: "bg-cyan-50",
    softText: "text-cyan-600",
  },
  {
    key: "avgProgressInProgress",
    label: "متوسط التقدّم % (غير منجز)",
    shortLabel: "متوسط التقدّم",
    icon: Percent,
    color: "bg-slate-600",
    softBg: "bg-slate-100",
    softText: "text-slate-600",
    format: (v) => `${v}%`,
  },
];

export function ResearchKPICards({ stats }: { stats: ResearchStats }) {
  return (
    <>
      {/* موبايل: شبكة 2×3 أوضح */}
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {kpis.map(({ key, shortLabel, icon: Icon, softBg, softText, format }) => {
          const value = format ? format(stats.totals[key]) : String(stats.totals[key]);
          return (
            <div
              key={key}
              className="rounded-xl border border-slate-100 bg-white p-2.5 min-w-0 shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`h-9 w-9 rounded-lg ${softBg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`h-4 w-4 ${softText}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold tabular-nums text-gray-900 leading-none">
                    {value}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 leading-tight truncate">
                    {shortLabel}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* حاسوب: التخطيط السابق بدون تغيير */}
      <div className="hidden md:grid gap-2 sm:gap-3 grid-cols-3 lg:grid-cols-6">
        {kpis.map(({ key, label, icon: Icon, color, format }) => {
          const value = format ? format(stats.totals[key]) : String(stats.totals[key]);
          return (
            <Card
              key={key}
              className="border-slate-100 bg-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 gap-0 overflow-hidden rounded-xl"
            >
              <CardContent className="p-2.5 sm:p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className={`${color} p-1.5 rounded-lg flex-shrink-0`}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-gray-900 truncate min-w-0 tabular-nums">
                    {value}
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-tight line-clamp-2">
                  {label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
