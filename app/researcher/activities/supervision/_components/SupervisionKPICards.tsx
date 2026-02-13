"use client";

import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Calendar, CheckCircle, XCircle, Users } from "lucide-react";
import type { Supervision } from "@prisma/client";

export type SupervisionStats = {
  total: number;
  completed: number;
  inProgress: number;
  last12Months: number;
  byDegreeType: Array<{ name: string; value: number }>;
  byStatus: Array<{ name: string; value: number }>;
  bySupervisionType: Array<{ name: string; value: number }>;
  byYear: Array<{ name: string; value: number }>;
};

function calculateStats(supervisions: Supervision[]): SupervisionStats {
  const total = supervisions.length;
  
  const completed = supervisions.filter((s) => s.status === "COMPLETED").length;
  const inProgress = total - completed;

  // الإشرافات خلال آخر 12 شهر
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const last12Months = supervisions.filter((s) => {
    const startDate = new Date(s.startDate);
    return startDate >= twelveMonthsAgo;
  }).length;

  // حسب نوع الدرجة
  const degreeTypeCounts: Record<string, number> = {};
  supervisions.forEach((s) => {
    degreeTypeCounts[s.degreeType] = (degreeTypeCounts[s.degreeType] || 0) + 1;
  });

  const degreeTypeLabels: Record<string, string> = {
    PHD: "دكتوراه",
    MASTERS: "ماجستير",
    BACHELORS: "بكالوريوس",
    HIGHER_DIPLOMA: "دبلوم عالي",
  };

  const byDegreeType = Object.entries(degreeTypeCounts)
    .map(([type, count]) => ({ name: degreeTypeLabels[type] || type, value: count }))
    .sort((a, b) => b.value - a.value);

  // حسب الحالة
  const statusCounts: Record<string, number> = {};
  supervisions.forEach((s) => {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  });

  const statusLabels: Record<string, string> = {
    COMPLETED: "مكتمل",
    IN_PROGRESS: "غير مكتمل",
  };

  const byStatus = Object.entries(statusCounts)
    .map(([status, count]) => ({ name: statusLabels[status] || status, value: count }))
    .sort((a, b) => b.value - a.value);

  // حسب نوع الإشراف (فقط لدكتوراه وماجستير)
  const supervisionTypeCounts: Record<string, number> = {};
  supervisions
    .filter((s) => s.supervisionType !== null)
    .forEach((s) => {
      if (s.supervisionType) {
        supervisionTypeCounts[s.supervisionType] = (supervisionTypeCounts[s.supervisionType] || 0) + 1;
      }
    });

  const supervisionTypeLabels: Record<string, string> = {
    SOLE: "منفرد",
    JOINT: "مشترك",
  };

  const bySupervisionType = Object.entries(supervisionTypeCounts)
    .map(([type, count]) => ({ name: supervisionTypeLabels[type] || type, value: count }))
    .sort((a, b) => b.value - a.value);

  // حسب السنة
  const byYear = supervisions.reduce<Record<number, number>>((acc, s) => {
    const y = new Date(s.startDate).getFullYear();
    acc[y] = (acc[y] ?? 0) + 1;
    return acc;
  }, {});

  const byYearData = Object.entries(byYear)
    .map(([year, count]) => ({ name: year, value: count }))
    .sort((a, b) => Number(a.name) - Number(b.name));

  return {
    total,
    completed,
    inProgress,
    last12Months,
    byDegreeType,
    byStatus,
    bySupervisionType,
    byYear: byYearData,
  };
}

export function useSupervisionStats(supervisions: Supervision[]): SupervisionStats {
  return calculateStats(supervisions);
}

export function SupervisionKPICards({ stats }: { stats: SupervisionStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* إجمالي الإشرافات */}
      <Card className="border border-slate-100 border-r-4 border-r-blue-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-blue-500/10 p-2 rounded-lg flex-shrink-0">
              <GraduationCap className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.total}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">إجمالي الإشرافات</p>
        </CardContent>
      </Card>

      {/* مكتمل */}
      <Card className="border border-slate-100 border-r-4 border-r-green-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-green-500/10 p-2 rounded-lg flex-shrink-0">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.completed}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">مكتمل</p>
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

      {/* غير مكتمل */}
      <Card className="border border-slate-100 border-r-4 border-r-amber-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-amber-500/10 p-2 rounded-lg flex-shrink-0">
              <XCircle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.inProgress}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">غير مكتمل</p>
        </CardContent>
      </Card>
    </div>
  );
}
