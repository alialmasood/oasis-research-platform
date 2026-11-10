"use client";

import { Fragment } from "react";
import { EmptyState } from "./EmptyState";
import {
  BookOpen,
  FileCheck,
  CheckCircle2,
  XCircle,
  Globe,
  MapPin,
  User,
  Database,
} from "lucide-react";

interface KpiStripProps {
  kpis: Array<{
    label: string;
    value: string;
  }>;
}

const researchKpiConfig = [
  { label: "إجمالي البحوث", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "البحوث المنشورة", icon: FileCheck, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "البحوث المنجزة", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  { label: "البحوث المخططة", icon: FileCheck, color: "text-yellow-600", bg: "bg-yellow-50" },
  { label: "البحوث غير المنجزة", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  { label: "البحوث العالمية", icon: Globe, color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "البحوث المحلية", icon: MapPin, color: "text-orange-600", bg: "bg-orange-50" },
  { label: "البحوث المفردة", icon: User, color: "text-teal-600", bg: "bg-teal-50" },
  { label: "Scopus", icon: Database, color: "text-cyan-600", bg: "bg-cyan-50" },
  { label: "Thomson Reuters", icon: Database, color: "text-amber-600", bg: "bg-amber-50" },
];

export function KpiStrip({ kpis }: KpiStripProps) {
  const hasData = kpis.some((kpi) => parseInt(kpi.value) > 0);

  if (!hasData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-6 shadow-sm">
        <EmptyState
          title="لا توجد بحوث"
          description="لم يتم إضافة أي بحوث بعد. ابدأ بإضافة أول بحث لك."
          icon={BookOpen}
          actionLabel="إضافة بحث جديد"
          actionHref="/researcher/research"
        />
      </div>
    );
  }

  return (
    <div className="bg-white/80 md:bg-white border border-slate-100 md:border-gray-200 rounded-xl p-2.5 md:p-4 shadow-none md:shadow-sm overflow-hidden kpi-strip-print">
      {/* هاتف: شبكة بطاقات احترافية 2×N */}
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {kpis.map((kpi, index) => {
          const config = researchKpiConfig[index] ?? researchKpiConfig[0];
          const Icon = config.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`h-8 w-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold tabular-nums text-gray-900 leading-none">
                    {kpi.value}
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500 leading-tight line-clamp-2">
                    {kpi.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* سطح المكتب: التخطيط الحالي بدون تغيير */}
      <div className="hidden md:block w-full overflow-x-hidden overflow-y-hidden kpi-strip-scroll">
        <div
          className="min-w-0 w-full pb-0 grid gap-y-1 kpi-strip-grid"
          style={{
            gridTemplateRows: "auto auto auto",
            gridTemplateColumns: "repeat(10, minmax(4rem, 1fr))",
            gridAutoFlow: "column",
          }}
        >
          {kpis.map((kpi, index) => {
            const config = researchKpiConfig[index];
            const Icon = config.icon;
            const hasSeparator = index !== 0;
            return (
              <Fragment key={kpi.label}>
                <div
                  className={`flex items-center justify-center overflow-hidden py-0.5 ${
                    hasSeparator ? "border-r border-slate-200" : ""
                  }`}
                >
                  <Icon className={`h-4 w-4 ${config.color} flex-shrink-0`} />
                </div>
                <div
                  className={`flex items-center justify-center overflow-hidden py-0.5 ${
                    hasSeparator ? "border-r border-slate-200" : ""
                  }`}
                >
                  <span className="text-xl font-bold text-gray-900 leading-none truncate max-w-full">
                    {kpi.value}
                  </span>
                </div>
                <div
                  className={`flex items-center justify-center overflow-hidden min-w-0 py-0.5 ${
                    hasSeparator ? "border-r border-slate-200" : ""
                  }`}
                >
                  <span className="text-sm text-slate-500 text-center leading-tight line-clamp-2 break-words w-full min-w-0">
                    {kpi.label}
                  </span>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
