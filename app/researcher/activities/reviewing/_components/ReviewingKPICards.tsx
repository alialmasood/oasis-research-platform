"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, CheckCircle, Clock, FileText } from "lucide-react";
import type { Reviewing } from "@prisma/client";

export type ReviewingStats = {
  total: number;
  completed: number;
  inProgress: number;
  planned: number;
  last12Months: number;
  byType: Array<{ name: string; value: number }>;
  byStatus: Array<{ name: string; value: number }>;
  byYear: Array<{ name: string; value: number }>;
};

function calculateStats(reviewings: Reviewing[]): ReviewingStats {
  const total = reviewings.length;
  
  const completed = reviewings.filter((r) => r.status === "COMPLETED").length;
  const inProgress = reviewings.filter((r) => r.status === "IN_PROGRESS").length;
  const planned = reviewings.filter((r) => r.status === "PLANNED").length;

  // التقويمات خلال آخر 12 شهر
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const last12Months = reviewings.filter((r) => {
    const date = new Date(r.date);
    return date >= twelveMonthsAgo;
  }).length;

  // حسب نوع التقويم
  const typeCounts: Record<string, number> = {};
  reviewings.forEach((r) => {
    typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
  });

  const typeLabels: Record<string, string> = {
    RESEARCHES: "بحوث",
    SCIENTIFIC_ARTICLES: "مقالات علمية",
    THESES: "رسائل وأطاريح",
    PATENTS: "براءات اختراع",
    SCIENTIFIC_CONSULTATIONS: "استشارات علمية",
  };

  const byType = Object.entries(typeCounts)
    .map(([type, count]) => ({ name: typeLabels[type] || type, value: count }))
    .sort((a, b) => b.value - a.value);

  // حسب الحالة
  const statusCounts: Record<string, number> = {};
  reviewings.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  const statusLabels: Record<string, string> = {
    COMPLETED: "مكتمل",
    IN_PROGRESS: "قيد التنفيذ",
    PLANNED: "مخطط",
  };

  const byStatus = Object.entries(statusCounts)
    .map(([status, count]) => ({ name: statusLabels[status] || status, value: count }))
    .sort((a, b) => b.value - a.value);

  // حسب السنة
  const byYear = reviewings.reduce<Record<number, number>>((acc, r) => {
    const y = new Date(r.date).getFullYear();
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
    planned,
    last12Months,
    byType,
    byStatus,
    byYear: byYearData,
  };
}

export function useReviewingStats(reviewings: Reviewing[]): ReviewingStats {
  return calculateStats(reviewings);
}

export function ReviewingKPICards({ stats }: { stats: ReviewingStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* إجمالي التقويمات */}
      <Card className="border border-slate-100 border-r-4 border-r-blue-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-blue-500/10 p-2 rounded-lg flex-shrink-0">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.total}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">إجمالي التقويمات</p>
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
              <FileText className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.last12Months}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">آخر 12 شهر</p>
        </CardContent>
      </Card>

      {/* قيد التنفيذ */}
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
          <p className="text-xs text-slate-500 leading-tight">قيد التنفيذ</p>
        </CardContent>
      </Card>
    </div>
  );
}
