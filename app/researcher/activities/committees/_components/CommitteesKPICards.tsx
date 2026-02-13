"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, UserCheck, Crown } from "lucide-react";
import type { Committee } from "@prisma/client";

export type CommitteesStats = {
  total: number;
  last12Months: number;
  asMember: number;
  asChairperson: number;
  uniqueTitles: number;
  byYear: Array<{ name: string; value: number }>;
  roleByYear: Array<{ name: string; عضو: number; رئيس: number }>;
  rolePieData: Array<{ name: string; value: number; color: string }>;
};

function calculateStats(committees: Committee[]): CommitteesStats {
  const total = committees.length;
  
  // اللجان خلال آخر 12 شهر
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const last12Months = committees.filter((c) => {
    const committeeDate = new Date(c.assignmentDate);
    return committeeDate >= twelveMonthsAgo;
  }).length;

  const asMember = committees.filter((c) => c.role === "MEMBER").length;
  const asChairperson = committees.filter((c) => c.role === "CHAIRPERSON").length;
  
  const titles = new Set<string>();
  committees.forEach((c) => {
    titles.add(c.title);
  });

  // حسب السنة
  const byYear = committees.reduce<Record<number, number>>((acc, c) => {
    const y = new Date(c.assignmentDate).getFullYear();
    acc[y] = (acc[y] ?? 0) + 1;
    return acc;
  }, {});

  const byYearData = Object.entries(byYear)
    .map(([year, count]) => ({ name: year, value: count }))
    .sort((a, b) => Number(a.name) - Number(b.name));

  // نوع الدور عبر الزمن
  const roleByYear = committees.reduce<Record<number, { member: number; chairperson: number }>>((acc, c) => {
    const y = new Date(c.assignmentDate).getFullYear();
    if (!acc[y]) acc[y] = { member: 0, chairperson: 0 };
    if (c.role === "MEMBER") acc[y].member += 1;
    else acc[y].chairperson += 1;
    return acc;
  }, {});

  const roleByYearData = Object.entries(roleByYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, v]) => ({
      name: year,
      عضو: v.member,
      رئيس: v.chairperson,
    }));

  // Pie chart للدور
  const rolePieData = [
    ...(asMember > 0 ? [{ name: "عضو لجنة", value: asMember, color: "#2563EB" }] : []),
    ...(asChairperson > 0 ? [{ name: "رئيس لجنة", value: asChairperson, color: "#f59e0b" }] : []),
  ].filter((d) => d.value > 0);

  return {
    total,
    last12Months,
    asMember,
    asChairperson,
    uniqueTitles: titles.size,
    byYear: byYearData,
    roleByYear: roleByYearData,
    rolePieData,
  };
}

export function useCommitteesStats(committees: Committee[]): CommitteesStats {
  return calculateStats(committees);
}

export function CommitteesKPICards({ stats }: { stats: CommitteesStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* إجمالي اللجان */}
      <Card className="border border-slate-100 border-r-4 border-r-blue-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-blue-500/10 p-2 rounded-lg flex-shrink-0">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.total}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">إجمالي اللجان</p>
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

      {/* كعضو لجنة */}
      <Card className="border border-slate-100 border-r-4 border-r-purple-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-purple-500/10 p-2 rounded-lg flex-shrink-0">
              <UserCheck className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.asMember}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">كعضو لجنة</p>
        </CardContent>
      </Card>

      {/* كرئيس لجنة */}
      <Card className="border border-slate-100 border-r-4 border-r-amber-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-amber-500/10 p-2 rounded-lg flex-shrink-0">
              <Crown className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.asChairperson}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">كرئيس لجنة</p>
        </CardContent>
      </Card>
    </div>
  );
}
