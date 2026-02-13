"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Presentation, Calendar, Mic, Users } from "lucide-react";
import type { Seminar } from "@prisma/client";

export type SeminarsStats = {
  total: number;
  last12Months: number;
  asPresenter: number;
  asParticipant: number;
  uniqueBeneficiaries: number;
  byYear: Array<{ name: string; value: number }>;
  participationByYear: Array<{ name: string; محاضر: number; مشترك: number }>;
  topBeneficiaries: Array<{ name: string; value: number }>;
  participationPieData: Array<{ name: string; value: number; color: string }>;
};

function calculateStats(seminars: Seminar[]): SeminarsStats {
  const total = seminars.length;
  
  // المناصب خلال آخر 12 شهر
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const last12Months = seminars.filter((s) => {
    const semDate = new Date(s.date);
    return semDate >= twelveMonthsAgo;
  }).length;

  const asPresenter = seminars.filter((s) => s.participationType === "PRESENTER").length;
  const asParticipant = seminars.filter((s) => s.participationType === "PARTICIPANT").length;
  
  const beneficiaries = new Set<string>();
  const beneficiaryCounts: Record<string, number> = {};
  
  seminars.forEach((s) => {
    beneficiaries.add(s.beneficiary);
    beneficiaryCounts[s.beneficiary] = (beneficiaryCounts[s.beneficiary] || 0) + 1;
  });

  // Top 5 beneficiaries
  const topBeneficiaries = Object.entries(beneficiaryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, value: count }));

  // حسب السنة
  const byYear = seminars.reduce<Record<number, number>>((acc, s) => {
    const y = new Date(s.date).getFullYear();
    acc[y] = (acc[y] ?? 0) + 1;
    return acc;
  }, {});

  const byYearData = Object.entries(byYear)
    .map(([year, count]) => ({ name: year, value: count }))
    .sort((a, b) => Number(a.name) - Number(b.name));

  // نوع المشاركة عبر الزمن
  const participationByYear = seminars.reduce<Record<number, { presenter: number; participant: number }>>((acc, s) => {
    const y = new Date(s.date).getFullYear();
    if (!acc[y]) acc[y] = { presenter: 0, participant: 0 };
    if (s.participationType === "PRESENTER") acc[y].presenter += 1;
    else acc[y].participant += 1;
    return acc;
  }, {});

  const participationByYearData = Object.entries(participationByYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, v]) => ({
      name: year,
      محاضر: v.presenter,
      مشترك: v.participant,
    }));

  // Pie chart للمشاركة
  const participationPieData = [
    ...(asPresenter > 0 ? [{ name: "محاضر", value: asPresenter, color: "#8b5cf6" }] : []),
    ...(asParticipant > 0 ? [{ name: "مشترك", value: asParticipant, color: "#f59e0b" }] : []),
  ].filter((d) => d.value > 0);

  return {
    total,
    last12Months,
    asPresenter,
    asParticipant,
    uniqueBeneficiaries: beneficiaries.size,
    byYear: byYearData,
    participationByYear: participationByYearData,
    topBeneficiaries,
    participationPieData,
  };
}

export function useSeminarsStats(seminars: Seminar[]): SeminarsStats {
  return calculateStats(seminars);
}

export function SeminarsKPICards({ stats }: { stats: SeminarsStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* إجمالي الندوات */}
      <Card className="border border-slate-100 border-r-4 border-r-blue-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-blue-500/10 p-2 rounded-lg flex-shrink-0">
              <Presentation className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.total}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">إجمالي الندوات</p>
        </CardContent>
      </Card>

      {/* آخر 12 شهر */}
      <Card className="border border-slate-100 border-r-4 border-r-green-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-green-500/10 p-2 rounded-lg flex-shrink-0">
              <Calendar className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.last12Months}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">آخر 12 شهر</p>
        </CardContent>
      </Card>

      {/* كمحاضر */}
      <Card className="border border-slate-100 border-r-4 border-r-purple-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-purple-500/10 p-2 rounded-lg flex-shrink-0">
              <Mic className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.asPresenter}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">كمحاضر</p>
        </CardContent>
      </Card>

      {/* كمشترك */}
      <Card className="border border-slate-100 border-r-4 border-r-amber-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-amber-500/10 p-2 rounded-lg flex-shrink-0">
              <Users className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.asParticipant}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">كمشترك</p>
        </CardContent>
      </Card>
    </div>
  );
}
