"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitCompare, Trophy } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ComparisonHeaderProps = {
  name: string;
  academicTitle: string;
  department: string;
  college: string;
  rank: number;
  total: number;
  totalPoints: number;
  filters: {
    year: string;
    period: string;
    metric: string;
  };
};

export function ComparisonHeader({
  name,
  academicTitle,
  department,
  college,
  rank,
  total,
  totalPoints,
  filters,
}: ComparisonHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }).map((_, index) => String(currentYear - index));

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (value === "all" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">المقارنات</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            اكتشف التدريسيين المشابهين لك وأفضل الأداء في كليتك
          </p>
          <p className="text-sm md:text-base text-slate-600 mt-1.5 font-medium">
            {academicTitle} {name} — {department} — {college}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full bg-[#2563EB] text-white px-3 h-9 text-base font-semibold flex items-center">
            <Trophy className="h-4 w-4 ml-2" />
            النقاط: {totalPoints}
          </Badge>
          <Button
            variant="outline"
            className="border-[#2563EB]/60 text-[#2563EB] hover:bg-[#2563EB]/10 h-9 px-3"
          >
            <GitCompare className="h-4 w-4 ml-2" />
            المركز {rank} من {total}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">السنة</label>
          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
            value={filters.year}
            onChange={(e) => updateParam("year", e.target.value)}
          >
            <option value={String(currentYear)}>هذه السنة</option>
            <option value="all">كل السنوات</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">الفترة</label>
          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
            value={filters.period}
            onChange={(e) => updateParam("period", e.target.value)}
          >
            <option value="all">الكل</option>
            <option value="first">النصف الأول</option>
            <option value="second">النصف الثاني</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">المعيار</label>
          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
            value={filters.metric}
            onChange={(e) => updateParam("metric", e.target.value)}
          >
            <option value="all">الكل</option>
            <option value="total">الإجمالي</option>
            <option value="research">البحث</option>
            <option value="conferences">المؤتمرات</option>
            <option value="publishing">النشر/الكتب</option>
            <option value="supervision">الإشراف على الطلبة</option>
            <option value="courses">الدورات</option>
            <option value="reviewing">التقويم العلمي</option>
            <option value="assignments">التكليفات</option>
            <option value="positions">المناصب</option>
            <option value="volunteering">الأعمال الطوعية</option>
            <option value="fieldVisits">الزيارات الميدانية</option>
          </select>
        </div>
      </div>
    </div>
  );
}
