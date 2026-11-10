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

const selectClass =
  "h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 max-w-[130px]";

const selectClassMobile =
  "h-8 rounded-lg border border-slate-200 bg-white px-1.5 text-[10px] text-slate-700 min-w-0 flex-1";

export function ComparisonHeader({
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
    <div className="flex flex-col gap-1.5">
      {/* موبايل */}
      <div className="md:hidden space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-base font-semibold text-gray-900 leading-snug min-w-0">
            المقارنات
          </h1>
          <div className="flex items-center gap-1 shrink-0">
            <Badge className="rounded-lg bg-[#2563EB] text-white px-1.5 h-8 text-[10px] font-semibold flex items-center">
              <Trophy className="h-3 w-3 ml-0.5" />
              {totalPoints}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="border-[#2563EB]/60 text-[#2563EB] hover:bg-[#2563EB]/10 h-8 px-1.5 text-[10px] shrink-0"
            >
              <GitCompare className="h-3 w-3 ml-0.5" />
              {rank}/{total}
            </Button>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-1.5">
          <div className="flex items-center gap-1 flex-nowrap min-w-0">
            <select
              aria-label="السنة"
              className={selectClassMobile}
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
            <select
              aria-label="الفترة"
              className={selectClassMobile}
              value={filters.period}
              onChange={(e) => updateParam("period", e.target.value)}
            >
              <option value="all">الفترة</option>
              <option value="first">النصف الأول</option>
              <option value="second">النصف الثاني</option>
            </select>
            <select
              aria-label="المعيار"
              className={selectClassMobile}
              value={filters.metric}
              onChange={(e) => updateParam("metric", e.target.value)}
            >
              <option value="all">المعيار</option>
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

      {/* سطح المكتب — مطابق للأصل */}
      <div className="hidden md:flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold text-gray-900">المقارنات</h1>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 justify-between">
          <p className="text-sm text-slate-500 leading-snug min-w-0">
            اكتشف التدريسيين المشابهين لك وأفضل الأداء في كليتك
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              aria-label="السنة"
              className={selectClass}
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
            <select
              aria-label="الفترة"
              className={selectClass}
              value={filters.period}
              onChange={(e) => updateParam("period", e.target.value)}
            >
              <option value="all">الفترة: الكل</option>
              <option value="first">النصف الأول</option>
              <option value="second">النصف الثاني</option>
            </select>
            <select
              aria-label="المعيار"
              className={`${selectClass} max-w-[150px]`}
              value={filters.metric}
              onChange={(e) => updateParam("metric", e.target.value)}
            >
              <option value="all">المعيار: الكل</option>
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
            <Badge className="rounded-full bg-[#2563EB] text-white px-2.5 h-8 text-xs font-semibold flex items-center shrink-0">
              <Trophy className="h-3.5 w-3.5 ml-1" />
              النقاط: {totalPoints}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="border-[#2563EB]/60 text-[#2563EB] hover:bg-[#2563EB]/10 h-8 px-2.5 text-xs shrink-0"
            >
              <GitCompare className="h-3.5 w-3.5 ml-1" />
              المركز {rank} من {total}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
