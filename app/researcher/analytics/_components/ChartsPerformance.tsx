"use client";

import { useEffect, useState } from "react";
import type { AnalyticsPerformance } from "@/lib/analytics/analyticsTypes";
import { SectionCard } from "./SectionCard";

type ChartsPerformanceProps = {
  data: AnalyticsPerformance;
};

export function ChartsPerformance({ data }: ChartsPerformanceProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="rounded-2xl border border-slate-100 bg-white shadow-lg h-[280px]" />;
  }

  return (
    <SectionCard title="تحليل الإنتاج مقابل الزمن (الأداء)" description="متوسط سنوي وأفضل/أضعف سنة">
      {data.yearly.length === 0 ? (
        <div className="text-sm text-slate-500">لا توجد بيانات للفترة المحددة.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
            أفضل سنة علميًا: {data.bestYear ? `${data.bestYear.year} (${data.bestYear.count})` : "—"}
          </div>
          <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
            أضعف سنة: {data.worstYear ? `${data.worstYear.year} (${data.worstYear.count})` : "—"}
          </div>
          <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
            متوسط النشاط السنوي: {data.averagePerYear}
          </div>
          <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
            عدد سنوات النشاط: {data.yearsCount}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
