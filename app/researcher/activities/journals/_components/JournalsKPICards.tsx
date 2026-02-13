"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Calendar, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import type { Journal } from "@prisma/client";

export type JournalsStats = {
  total: number;
  active: number;
  inactive: number;
  last12Months: number;
  byRole: Array<{ name: string; value: number }>;
  byType: Array<{ name: string; value: number }>;
  byYear: Array<{ name: string; value: number }>;
  averageImpactFactor: number;
};

function calculateStats(journals: Journal[]): JournalsStats {
  const total = journals.length;
  
  const active = journals.filter((j) => j.isActive).length;
  const inactive = total - active;

  // العضويات خلال آخر 12 شهر
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const last12Months = journals.filter((j) => {
    const startDate = new Date(j.startDate);
    return startDate >= twelveMonthsAgo;
  }).length;

  // حسب الدور
  const roleCounts: Record<string, number> = {};
  journals.forEach((j) => {
    roleCounts[j.role] = (roleCounts[j.role] || 0) + 1;
  });

  const roleLabels: Record<string, string> = {
    EDITOR_IN_CHIEF: "مدير تحرير",
    ASSOCIATE_EDITOR: "محرر مساعد",
    EDITORIAL_BOARD: "عضو هيئة تحرير",
    REVIEWER: "محكم",
  };

  const byRole = Object.entries(roleCounts)
    .map(([role, count]) => ({ name: roleLabels[role] || role, value: count }))
    .sort((a, b) => b.value - a.value);

  // حسب النوع
  const typeCounts: Record<string, number> = {};
  journals.forEach((j) => {
    typeCounts[j.type] = (typeCounts[j.type] || 0) + 1;
  });

  const typeLabels: Record<string, string> = {
    LOCAL: "محلية",
    INTERNATIONAL: "عالمية",
    ARABIC: "عربية",
    ENGLISH: "إنجليزية",
  };

  const byType = Object.entries(typeCounts)
    .map(([type, count]) => ({ name: typeLabels[type] || type, value: count }))
    .sort((a, b) => b.value - a.value);

  // حسب السنة
  const byYear = journals.reduce<Record<number, number>>((acc, j) => {
    const y = new Date(j.startDate).getFullYear();
    acc[y] = (acc[y] ?? 0) + 1;
    return acc;
  }, {});

  const byYearData = Object.entries(byYear)
    .map(([year, count]) => ({ name: year, value: count }))
    .sort((a, b) => Number(a.name) - Number(b.name));

  // متوسط معامل التأثير
  const journalsWithImpact = journals.filter((j) => j.impactFactor !== null && j.impactFactor !== undefined);
  const averageImpactFactor =
    journalsWithImpact.length > 0
      ? journalsWithImpact.reduce((sum, j) => sum + (j.impactFactor || 0), 0) / journalsWithImpact.length
      : 0;

  return {
    total,
    active,
    inactive,
    last12Months,
    byRole,
    byType,
    byYear: byYearData,
    averageImpactFactor,
  };
}

export function useJournalsStats(journals: Journal[]): JournalsStats {
  return calculateStats(journals);
}

export function JournalsKPICards({ stats }: { stats: JournalsStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* إجمالي العضويات */}
      <Card className="border border-slate-100 border-r-4 border-r-blue-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-blue-500/10 p-2 rounded-lg flex-shrink-0">
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.total}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">إجمالي العضويات</p>
        </CardContent>
      </Card>

      {/* نشط حالياً */}
      <Card className="border border-slate-100 border-r-4 border-r-green-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-green-500/10 p-2 rounded-lg flex-shrink-0">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.active}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">نشط حالياً</p>
        </CardContent>
      </Card>

      {/* آخر 12 شهر */}
      <Card className="border border-slate-100 border-r-4 border-r-purple-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-purple-500/10 p-2 rounded-lg flex-shrink-0">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.last12Months}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">آخر 12 شهر</p>
        </CardContent>
      </Card>

      {/* متوسط معامل التأثير */}
      <Card className="border border-slate-100 border-r-4 border-r-amber-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-amber-500/10 p-2 rounded-lg flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.averageImpactFactor > 0 ? stats.averageImpactFactor.toFixed(2) : "—"}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">متوسط معامل التأثير</p>
        </CardContent>
      </Card>
    </div>
  );
}
