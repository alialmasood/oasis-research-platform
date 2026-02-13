"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Building2, Calendar, TrendingUp, Clock, Award } from "lucide-react";
import type { Position } from "@prisma/client";

export type PositionsStats = {
  total: number;
  last12Months: number;
  longestDurationDays: number;
  longestDurationPosition: { title: string; days: number } | null;
  topOrganization: { name: string; count: number } | null;
  totalDurationYears: number;
  totalDurationMonths: number;
  totalDurationDays: number;
  uniqueOrganizations: number;
  byYear: Array<{ name: string; value: number }>;
  topOrganizations: Array<{ name: string; value: number }>;
  durationDistribution: {
    short: number; // < 6 أشهر
    medium: number; // 6-24 شهر
    long: number; // > 24 شهر
  };
};

function calculateDurationInDays(years: number, months: number, days: number): number {
  return years * 365 + months * 30 + days;
}

function calculateStats(positions: Position[]): PositionsStats {
  const total = positions.length;
  let totalYears = 0;
  let totalMonths = 0;
  let totalDays = 0;
  const orgs = new Set<string>();
  const orgCounts: Record<string, number> = {};
  let longestDurationDays = 0;
  let longestDurationPosition: { title: string; days: number } | null = null;

  // حساب المناصب خلال آخر 12 شهر
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const last12Months = positions.filter((p) => {
    const posDate = new Date(p.positionDate);
    return posDate >= twelveMonthsAgo;
  }).length;

  positions.forEach((p) => {
    totalYears += p.durationYears;
    totalMonths += p.durationMonths;
    totalDays += p.durationDays;
    orgs.add(p.organization);
    orgCounts[p.organization] = (orgCounts[p.organization] || 0) + 1;

    // حساب أطول مدة
    const durationDays = calculateDurationInDays(p.durationYears, p.durationMonths, p.durationDays);
    if (durationDays > longestDurationDays) {
      longestDurationDays = durationDays;
      longestDurationPosition = { title: p.title, days: durationDays };
    }
  });

  // تحويل الأيام والأشهر إلى سنوات وأشهر
  totalMonths += Math.floor(totalDays / 30);
  totalDays = totalDays % 30;
  totalYears += Math.floor(totalMonths / 12);
  totalMonths = totalMonths % 12;

  // أكثر جهة تكرارًا
  const topOrgEntries = Object.entries(orgCounts).sort((a, b) => b[1] - a[1]);
  const topOrganization = topOrgEntries.length > 0
    ? { name: topOrgEntries[0][0], count: topOrgEntries[0][1] }
    : null;

  // Top 5 organizations للرسم البياني
  const topOrganizations = topOrgEntries
    .slice(0, 5)
    .map(([name, count]) => ({ name, value: count }));

  // توزيع المدد
  let short = 0; // < 6 أشهر (< 180 يوم)
  let medium = 0; // 6-24 شهر (180-730 يوم)
  let long = 0; // > 24 شهر (> 730 يوم)

  positions.forEach((p) => {
    const days = calculateDurationInDays(p.durationYears, p.durationMonths, p.durationDays);
    if (days < 180) {
      short++;
    } else if (days <= 730) {
      medium++;
    } else {
      long++;
    }
  });

  const byYear = positions.reduce<Record<number, number>>((acc, p) => {
    const year = new Date(p.positionDate).getFullYear();
    acc[year] = (acc[year] ?? 0) + 1;
    return acc;
  }, {});

  const byYearData = Object.entries(byYear)
    .map(([year, count]) => ({ name: year, value: count }))
    .sort((a, b) => Number(a.name) - Number(b.name));

  return {
    total,
    last12Months,
    longestDurationDays,
    longestDurationPosition,
    topOrganization,
    totalDurationYears: totalYears,
    totalDurationMonths: totalMonths,
    totalDurationDays: totalDays,
    uniqueOrganizations: orgs.size,
    byYear: byYearData,
    topOrganizations,
    durationDistribution: { short, medium, long },
  };
}

export function usePositionsStats(positions: Position[]): PositionsStats {
  return calculateStats(positions);
}

export function PositionsKPICards({ stats }: { stats: PositionsStats }) {
  const formatDurationFromDays = (days: number): string => {
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const remainingDays = days % 30;
    const parts: string[] = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? "سنة" : "سنة"}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? "شهر" : "شهر"}`);
    if (remainingDays > 0 && years === 0) parts.push(`${remainingDays} ${remainingDays === 1 ? "يوم" : "يوم"}`);
    return parts.length > 0 ? parts.join("، ") : "0";
  };

  return (
    <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-4">
      {/* إجمالي المناصب */}
      <Card className="border border-slate-100 border-r-4 border-r-blue-500 bg-white shadow-lg">
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="bg-blue-500 p-1.5 rounded-lg flex-shrink-0">
              <Briefcase className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="text-lg sm:text-xl font-black text-gray-900 truncate min-w-0">
              {stats.total}
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-tight">إجمالي المناصب</p>
        </CardContent>
      </Card>

      {/* المناصب خلال آخر 12 شهر */}
      <Card className="border border-slate-100 border-r-4 border-r-green-500 bg-white shadow-lg">
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="bg-green-500 p-1.5 rounded-lg flex-shrink-0">
              <Calendar className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="text-lg sm:text-xl font-black text-gray-900 truncate min-w-0">
              {stats.last12Months}
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-tight">آخر 12 شهر</p>
        </CardContent>
      </Card>

      {/* أطول مدة منصب */}
      <Card className="border border-slate-100 border-r-4 border-r-purple-500 bg-white shadow-lg">
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="bg-purple-500 p-1.5 rounded-lg flex-shrink-0">
              <Clock className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="text-xs sm:text-sm font-black text-gray-900 truncate min-w-0 text-left">
              {stats.longestDurationPosition
                ? formatDurationFromDays(stats.longestDurationDays)
                : "—"}
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-tight line-clamp-1" title={stats.longestDurationPosition?.title}>
            {stats.longestDurationPosition?.title || "أطول مدة"}
          </p>
        </CardContent>
      </Card>

      {/* أكثر جهة تكرارًا */}
      <Card className="border border-slate-100 border-r-4 border-r-amber-500 bg-white shadow-lg">
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="bg-amber-500 p-1.5 rounded-lg flex-shrink-0">
              <Award className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="text-lg sm:text-xl font-black text-gray-900 truncate min-w-0">
              {stats.topOrganization?.count || 0}
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-tight line-clamp-1" title={stats.topOrganization?.name}>
            {stats.topOrganization?.name || "أكثر جهة"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
