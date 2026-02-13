"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Award, Calendar, Building2, TrendingUp } from "lucide-react";
import type { Certificate } from "@prisma/client";

export type CertificatesStats = {
  total: number;
  last12Months: number;
  uniqueOrganizations: number;
  byYear: Array<{ name: string; value: number }>;
  byMonth: Array<{ name: string; value: number }>;
  topOrganizations: Array<{ name: string; value: number }>;
};

function calculateStats(certificates: Certificate[]): CertificatesStats {
  const total = certificates.length;
  
  // الشهادات خلال آخر 12 شهر
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const last12Months = certificates.filter((c) => {
    const certDate = new Date(c.date);
    return certDate >= twelveMonthsAgo;
  }).length;

  const organizations = new Set<string>();
  const organizationCounts: Record<string, number> = {};
  
  certificates.forEach((c) => {
    organizations.add(c.issuingOrganization);
    organizationCounts[c.issuingOrganization] = (organizationCounts[c.issuingOrganization] || 0) + 1;
  });

  // Top 5 organizations
  const topOrganizations = Object.entries(organizationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, value: count }));

  // حسب السنة
  const byYear = certificates.reduce<Record<number, number>>((acc, c) => {
    const y = new Date(c.date).getFullYear();
    acc[y] = (acc[y] ?? 0) + 1;
    return acc;
  }, {});

  const byYearData = Object.entries(byYear)
    .map(([year, count]) => ({ name: year, value: count }))
    .sort((a, b) => Number(a.name) - Number(b.name));

  // حسب الشهر (آخر 12 شهر) - نعرض آخر 12 شهر بترتيب زمني
  const monthNames = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  // إنشاء قائمة بآخر 12 شهر بترتيب زمني (من الأقدم إلى الأحدث)
  const last12MonthsList: Array<{ monthIndex: number; monthName: string; year: number }> = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last12MonthsList.push({
      monthIndex: date.getMonth(),
      monthName: monthNames[date.getMonth()],
      year: date.getFullYear(),
    });
  }

  // حساب عدد الشهادات لكل شهر من آخر 12 شهر
  const byMonth = certificates
    .filter((c) => {
      const certDate = new Date(c.date);
      return certDate >= twelveMonthsAgo;
    })
    .reduce<Record<string, number>>((acc, c) => {
      const certDate = new Date(c.date);
      const key = `${certDate.getFullYear()}-${certDate.getMonth()}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

  // إنشاء البيانات بترتيب زمني مع عرض اسم الشهر فقط
  const byMonthData = last12MonthsList.map(({ monthIndex, monthName, year }) => {
    const key = `${year}-${monthIndex}`;
    return {
      name: monthName,
      value: byMonth[key] ?? 0,
    };
  });

  return {
    total,
    last12Months,
    uniqueOrganizations: organizations.size,
    byYear: byYearData,
    byMonth: byMonthData,
    topOrganizations,
  };
}

export function useCertificatesStats(certificates: Certificate[]): CertificatesStats {
  return calculateStats(certificates);
}

export function CertificatesKPICards({ stats }: { stats: CertificatesStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* إجمالي الشهادات */}
      <Card className="border border-slate-100 border-r-4 border-r-blue-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-blue-500/10 p-2 rounded-lg flex-shrink-0">
              <Award className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.total}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">إجمالي الشهادات</p>
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

      {/* عدد الجهات المانحة */}
      <Card className="border border-slate-100 border-r-4 border-r-purple-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-purple-500/10 p-2 rounded-lg flex-shrink-0">
              <Building2 className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.uniqueOrganizations}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">عدد الجهات المانحة</p>
        </CardContent>
      </Card>

      {/* أكثر جهة تكرارًا */}
      <Card className="border border-slate-100 border-r-4 border-r-amber-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-amber-500/10 p-2 rounded-lg flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.topOrganizations.length > 0 ? stats.topOrganizations[0].value : 0}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">
            {stats.topOrganizations.length > 0 ? stats.topOrganizations[0].name.substring(0, 15) + (stats.topOrganizations[0].name.length > 15 ? "..." : "") : "—"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
