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
    return (
      <>
        <div className="md:hidden rounded-xl border border-slate-100 bg-white shadow-sm h-[168px]" />
        <div className="hidden md:block rounded-2xl border border-slate-100 bg-white shadow-lg h-[280px]" />
      </>
    );
  }

  const items = [
    {
      label: "أفضل سنة علميًا",
      value: data.bestYear ? `${data.bestYear.year}` : "—",
      hint: data.bestYear ? `${data.bestYear.count} نشاط` : "لا تتوفر بيانات",
      tone: "border-emerald-200 bg-emerald-50/60",
    },
    {
      label: "أضعف سنة",
      value: data.worstYear ? `${data.worstYear.year}` : "—",
      hint: data.worstYear ? `${data.worstYear.count} نشاط` : "لا تتوفر بيانات",
      tone: "border-rose-200 bg-rose-50/50",
    },
    {
      label: "متوسط النشاط السنوي",
      value: String(data.averagePerYear),
      hint: "متوسط عبر سنوات النشاط",
      tone: "border-blue-200 bg-blue-50/50",
    },
    {
      label: "سنوات النشاط",
      value: String(data.yearsCount),
      hint: "عدد السنوات التي ظهر فيها نشاط",
      tone: "border-slate-200 bg-slate-50/70",
    },
  ];

  return (
    <SectionCard title="تحليل الأداء عبر السنوات" description="أفضل وأضعف سنة مع متوسط الإنتاج السنوي">
      {data.yearly.length === 0 ? (
        <div className="min-h-[96px] md:min-h-[160px] flex items-center justify-center text-xs md:text-sm text-slate-500">
          لا توجد بيانات للفترة المحددة.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 md:gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border px-2.5 py-2 md:px-3.5 md:py-3 min-h-[64px] md:min-h-0 h-full ${item.tone}`}
            >
              <p className="text-[10px] md:text-xs text-slate-500 truncate">{item.label}</p>
              <p className="text-base md:text-xl font-bold tabular-nums text-slate-900 mt-0.5 md:mt-1">
                {item.value}
              </p>
              <p className="text-[10px] md:text-[11px] text-slate-500 mt-0.5 md:mt-1 line-clamp-1 md:line-clamp-none">
                {item.hint}
              </p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
