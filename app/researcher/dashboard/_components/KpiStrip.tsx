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
  { label: "إجمالي البحوث", icon: BookOpen, color: "text-blue-600" },
  { label: "البحوث المنشورة", icon: FileCheck, color: "text-purple-600" },
  { label: "البحوث المنجزة", icon: CheckCircle2, color: "text-green-600" },
  { label: "البحوث المخططة", icon: FileCheck, color: "text-yellow-600" },
  { label: "البحوث غير المنجزة", icon: XCircle, color: "text-red-600" },
  { label: "البحوث العالمية", icon: Globe, color: "text-indigo-600" },
  { label: "البحوث المحلية", icon: MapPin, color: "text-orange-600" },
  { label: "البحوث المفردة", icon: User, color: "text-teal-600" },
  { label: "Scopus", icon: Database, color: "text-cyan-600" },
  { label: "Thomson Reuters", icon: Database, color: "text-amber-600" },
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
    <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 shadow-sm overflow-hidden kpi-strip-print">
      {/* شبكة 3 صفوف × 10 أعمدة: صف الأيقونات، صف الأرقام، صف الأسماء — محاذاة موحدة */}
      <div className="w-full overflow-x-auto overflow-y-hidden md:overflow-x-hidden md:overflow-y-hidden kpi-strip-scroll">
        <div
          className="min-w-max pb-1 md:min-w-0 md:w-full md:pb-0 grid gap-y-1 kpi-strip-grid"
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
                <div className={`flex items-center justify-center overflow-hidden py-0.5 ${hasSeparator ? "border-r border-slate-200" : ""}`}>
                  <Icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${config.color} flex-shrink-0`} />
                </div>
                <div className={`flex items-center justify-center overflow-hidden py-0.5 ${hasSeparator ? "border-r border-slate-200" : ""}`}>
                  <span className="text-base md:text-xl font-bold text-gray-900 leading-none truncate max-w-full">{kpi.value}</span>
                </div>
                <div className={`flex items-center justify-center overflow-hidden min-w-0 py-0.5 ${hasSeparator ? "border-r border-slate-200" : ""}`}>
                  <span className="text-[11px] md:text-sm text-slate-500 text-center leading-tight line-clamp-2 break-words w-full min-w-0">{kpi.label}</span>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
