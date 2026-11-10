"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Award, Calendar, Target } from "lucide-react";
import type { FieldVisit } from "@prisma/client";

const POINTS: Record<string, number> = {
  FIELD_VISIT_SUPERVISION: 12,
  VOLUNTARY_INSIDE_MINISTRY: 8,
  SERVICE_OUTSIDE_MINISTRY: 6,
};

const MAX_SECTION_POINTS = 30;

export type FieldVisitsStats = {
  total: number;
  totalPoints: number;
  last12Months: number;
  fieldVisitCount: number;
  voluntaryCount: number;
  serviceCount: number;
  byYear: Array<{ name: string; value: number }>;
  byType: Array<{ name: string; value: number; color: string }>;
};

function calculateStats(items: FieldVisit[]): FieldVisitsStats {
  const total = items.length;
  const totalPoints = Math.min(
    items.reduce((sum, i) => sum + (POINTS[i.type] ?? 0), 0),
    MAX_SECTION_POINTS
  );

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const last12Months = items.filter((i) => new Date(i.activityDate) >= twelveMonthsAgo).length;

  const fieldVisitCount = items.filter((i) => i.type === "FIELD_VISIT_SUPERVISION").length;
  const voluntaryCount = items.filter((i) => i.type === "VOLUNTARY_INSIDE_MINISTRY").length;
  const serviceCount = items.filter((i) => i.type === "SERVICE_OUTSIDE_MINISTRY").length;

  const byYearRecord = items.reduce<Record<number, number>>((acc, i) => {
    const y = new Date(i.activityDate).getFullYear();
    acc[y] = (acc[y] ?? 0) + 1;
    return acc;
  }, {});
  const byYear = Object.entries(byYearRecord)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => Number(a.name) - Number(b.name));

  const typeColors: Record<string, string> = {
    FIELD_VISIT_SUPERVISION: "#2563EB",
    VOLUNTARY_INSIDE_MINISTRY: "#10b981",
    SERVICE_OUTSIDE_MINISTRY: "#f59e0b",
  };
  const typeNames: Record<string, string> = {
    FIELD_VISIT_SUPERVISION: "زيارة ميدانية (12 درجة)",
    VOLUNTARY_INSIDE_MINISTRY: "عمل تطوعي داخل الوزارة (8 درجات)",
    SERVICE_OUTSIDE_MINISTRY: "خدمة خارج الوزارة (6 درجات)",
  };
  const byType = [
    ...(fieldVisitCount > 0 ? [{ name: typeNames.FIELD_VISIT_SUPERVISION, value: fieldVisitCount, color: typeColors.FIELD_VISIT_SUPERVISION }] : []),
    ...(voluntaryCount > 0 ? [{ name: typeNames.VOLUNTARY_INSIDE_MINISTRY, value: voluntaryCount, color: typeColors.VOLUNTARY_INSIDE_MINISTRY }] : []),
    ...(serviceCount > 0 ? [{ name: typeNames.SERVICE_OUTSIDE_MINISTRY, value: serviceCount, color: typeColors.SERVICE_OUTSIDE_MINISTRY }] : []),
  ];

  return {
    total,
    totalPoints,
    last12Months,
    fieldVisitCount,
    voluntaryCount,
    serviceCount,
    byYear,
    byType,
  };
}

export function useFieldVisitsStats(items: FieldVisit[]): FieldVisitsStats {
  return calculateStats(items);
}

export function FieldVisitsKPICards({ stats }: { stats: FieldVisitsStats }) {
  const mobileItems = [
    {
      key: "total",
      label: "الإجمالي",
      value: String(stats.total),
      icon: MapPin,
      softBg: "bg-blue-50",
      softText: "text-blue-600",
    },
    {
      key: "points",
      label: "الدرجة / 30",
      value: String(stats.totalPoints),
      icon: Award,
      softBg: "bg-emerald-50",
      softText: "text-emerald-600",
    },
    {
      key: "last12",
      label: "آخر 12 شهر",
      value: String(stats.last12Months),
      icon: Calendar,
      softBg: "bg-purple-50",
      softText: "text-purple-600",
    },
    {
      key: "field",
      label: "زيارات ميدانية",
      value: String(stats.fieldVisitCount),
      icon: Target,
      softBg: "bg-amber-50",
      softText: "text-amber-600",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {mobileItems.map(({ key, label, value, icon: Icon, softBg, softText }) => (
          <div
            key={key}
            className="h-[64px] rounded-xl border border-slate-100 bg-white px-2.5 py-2 min-w-0 shadow-sm flex items-center"
          >
            <div className="flex items-center gap-2 min-w-0 w-full">
              <div className={`h-8 w-8 rounded-lg ${softBg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-3.5 w-3.5 ${softText}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold tabular-nums text-gray-900 leading-none truncate">
                  {value}
                </div>
                <p className="mt-1 text-[10px] text-slate-500 leading-tight truncate">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border border-slate-100 border-r-4 border-r-blue-500 bg-white shadow-lg min-h-[92px]">
          <CardContent className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="bg-blue-500/10 p-2 rounded-lg flex-shrink-0">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-xl md:text-2xl font-black text-gray-900">{stats.total}</div>
            </div>
            <p className="text-xs text-slate-500 leading-tight">إجمالي السجلات</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 border-r-4 border-r-emerald-500 bg-white shadow-lg min-h-[92px]">
          <CardContent className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="bg-emerald-500/10 p-2 rounded-lg flex-shrink-0">
                <Award className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-xl md:text-2xl font-black text-gray-900">
                {stats.totalPoints} / {MAX_SECTION_POINTS}
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-tight">الدرجة المحسوبة (الحد الأقصى 30)</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 border-r-4 border-r-purple-500 bg-white shadow-lg min-h-[92px]">
          <CardContent className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="bg-purple-500/10 p-2 rounded-lg flex-shrink-0">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-xl md:text-2xl font-black text-gray-900">{stats.last12Months}</div>
            </div>
            <p className="text-xs text-slate-500 leading-tight">آخر 12 شهر</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 border-r-4 border-r-amber-500 bg-white shadow-lg min-h-[92px]">
          <CardContent className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="bg-amber-500/10 p-2 rounded-lg flex-shrink-0">
                <Target className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-xl md:text-2xl font-black text-gray-900">{stats.fieldVisitCount}</div>
            </div>
            <p className="text-xs text-slate-500 leading-tight">زيارات ميدانية (12 درجة)</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
