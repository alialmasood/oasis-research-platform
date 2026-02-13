"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Calendar, CheckCircle2, Clock } from "lucide-react";
import type { Assignment } from "@prisma/client";

export type AssignmentsStats = {
  total: number;
  completed: number;
  inProgress: number;
  last12Months: number;
  byYear: Array<{ name: string; value: number }>;
  statusByYear: Array<{ name: string; منتهي: number; "غير منتهي": number }>;
  completionRate: number;
};

function calculateStats(assignments: Assignment[]): AssignmentsStats {
  const total = assignments.length;
  const completed = assignments.filter((a) => a.status === "COMPLETED").length;
  const inProgress = assignments.filter((a) => a.status === "IN_PROGRESS").length;
  
  // التكليفات خلال آخر 12 شهر
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const last12Months = assignments.filter((a) => {
    const assignmentDate = new Date(a.assignmentDate);
    return assignmentDate >= twelveMonthsAgo;
  }).length;

  // حسب السنة
  const byYear = assignments.reduce<Record<number, number>>((acc, a) => {
    const y = new Date(a.assignmentDate).getFullYear();
    acc[y] = (acc[y] ?? 0) + 1;
    return acc;
  }, {});

  const byYearData = Object.entries(byYear)
    .map(([year, count]) => ({ name: year, value: count }))
    .sort((a, b) => Number(a.name) - Number(b.name));

  // حالة التكليفات عبر الزمن
  const statusByYear = assignments.reduce<Record<number, { completed: number; inProgress: number }>>((acc, a) => {
    const y = new Date(a.assignmentDate).getFullYear();
    if (!acc[y]) acc[y] = { completed: 0, inProgress: 0 };
    if (a.status === "COMPLETED") acc[y].completed += 1;
    else acc[y].inProgress += 1;
    return acc;
  }, {});

  const statusByYearData = Object.entries(statusByYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, v]) => ({
      name: year,
      منتهي: v.completed,
      "غير منتهي": v.inProgress,
    }));

  // معدل الإنجاز
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    inProgress,
    last12Months,
    byYear: byYearData,
    statusByYear: statusByYearData,
    completionRate,
  };
}

export function useAssignmentsStats(assignments: Assignment[]): AssignmentsStats {
  return calculateStats(assignments);
}

export function AssignmentsKPICards({ stats }: { stats: AssignmentsStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* إجمالي التكليفات */}
      <Card className="border border-slate-100 border-r-4 border-r-blue-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-blue-500/10 p-2 rounded-lg flex-shrink-0">
              <ClipboardList className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.total}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">إجمالي التكليفات</p>
        </CardContent>
      </Card>

      {/* منتهي */}
      <Card className="border border-slate-100 border-r-4 border-r-green-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-green-500/10 p-2 rounded-lg flex-shrink-0">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.completed}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">منتهي</p>
        </CardContent>
      </Card>

      {/* غير منتهي */}
      <Card className="border border-slate-100 border-r-4 border-r-amber-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-amber-500/10 p-2 rounded-lg flex-shrink-0">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.inProgress}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">غير منتهي</p>
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
    </div>
  );
}
