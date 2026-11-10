"use client";

import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Calendar, Mic, Users } from "lucide-react";
import type { Course } from "@prisma/client";

export type CoursesStats = {
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

function calculateStats(courses: Course[]): CoursesStats {
  const total = courses.length;

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const last12Months = courses.filter((c) => {
    const courseDate = new Date(c.date);
    return courseDate >= twelveMonthsAgo;
  }).length;

  const asPresenter = courses.filter((c) => c.participationType === "PRESENTER").length;
  const asParticipant = courses.filter((c) => c.participationType === "PARTICIPANT").length;

  const beneficiaries = new Set<string>();
  const beneficiaryCounts: Record<string, number> = {};

  courses.forEach((c) => {
    beneficiaries.add(c.beneficiary);
    beneficiaryCounts[c.beneficiary] = (beneficiaryCounts[c.beneficiary] || 0) + 1;
  });

  const topBeneficiaries = Object.entries(beneficiaryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, value: count }));

  const byYear = courses.reduce<Record<number, number>>((acc, c) => {
    const y = new Date(c.date).getFullYear();
    acc[y] = (acc[y] ?? 0) + 1;
    return acc;
  }, {});

  const byYearData = Object.entries(byYear)
    .map(([year, count]) => ({ name: year, value: count }))
    .sort((a, b) => Number(a.name) - Number(b.name));

  const participationByYear = courses.reduce<
    Record<number, { presenter: number; participant: number }>
  >((acc, c) => {
    const y = new Date(c.date).getFullYear();
    if (!acc[y]) acc[y] = { presenter: 0, participant: 0 };
    if (c.participationType === "PRESENTER") acc[y].presenter += 1;
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

export function useCoursesStats(courses: Course[]): CoursesStats {
  return calculateStats(courses);
}

export function CoursesKPICards({ stats }: { stats: CoursesStats }) {
  const mobileItems = [
    {
      label: "الإجمالي",
      value: String(stats.total),
      icon: GraduationCap,
      softBg: "bg-blue-50",
      softText: "text-blue-600",
    },
    {
      label: "آخر 12 شهر",
      value: String(stats.last12Months),
      icon: Calendar,
      softBg: "bg-green-50",
      softText: "text-green-600",
    },
    {
      label: "كمحاضر",
      value: String(stats.asPresenter),
      icon: Mic,
      softBg: "bg-purple-50",
      softText: "text-purple-600",
    },
    {
      label: "كمشترك",
      value: String(stats.asParticipant),
      icon: Users,
      softBg: "bg-amber-50",
      softText: "text-amber-600",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {mobileItems.map(({ label, value, icon: Icon, softBg, softText }) => (
          <div
            key={label}
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
                <GraduationCap className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-xl md:text-2xl font-black text-gray-900">{stats.total}</div>
            </div>
            <p className="text-xs text-slate-500 leading-tight">إجمالي الدورات</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 border-r-4 border-r-green-500 bg-white shadow-lg min-h-[92px]">
          <CardContent className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="bg-green-500/10 p-2 rounded-lg flex-shrink-0">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-xl md:text-2xl font-black text-gray-900">{stats.last12Months}</div>
            </div>
            <p className="text-xs text-slate-500 leading-tight">آخر 12 شهر</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 border-r-4 border-r-purple-500 bg-white shadow-lg min-h-[92px]">
          <CardContent className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="bg-purple-500/10 p-2 rounded-lg flex-shrink-0">
                <Mic className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-xl md:text-2xl font-black text-gray-900">{stats.asPresenter}</div>
            </div>
            <p className="text-xs text-slate-500 leading-tight">كمحاضر</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 border-r-4 border-r-amber-500 bg-white shadow-lg min-h-[92px]">
          <CardContent className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="bg-amber-500/10 p-2 rounded-lg flex-shrink-0">
                <Users className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-xl md:text-2xl font-black text-gray-900">{stats.asParticipant}</div>
            </div>
            <p className="text-xs text-slate-500 leading-tight">كمشترك</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
