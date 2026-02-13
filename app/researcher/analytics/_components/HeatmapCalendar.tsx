"use client";

import type { AnalyticsHeatmapCell } from "@/lib/analytics/analyticsTypes";
import { SectionCard } from "./SectionCard";

type HeatmapCalendarProps = {
  heatmap: AnalyticsHeatmapCell[];
};

function getIntensity(value: number, max: number) {
  if (max === 0) return "bg-slate-100";
  const ratio = value / max;
  if (ratio > 0.75) return "bg-blue-600";
  if (ratio > 0.5) return "bg-blue-500";
  if (ratio > 0.25) return "bg-blue-300";
  if (ratio > 0) return "bg-blue-200";
  return "bg-slate-100";
}

export function HeatmapCalendar({ heatmap }: HeatmapCalendarProps) {
  const max = heatmap.reduce((acc, cell) => Math.max(acc, cell.value), 0);
  const mostActive = heatmap.reduce<AnalyticsHeatmapCell | null>((best, cell) => {
    if (!best || cell.value > best.value) return cell;
    return best;
  }, null);
  const leastActive = heatmap.reduce<AnalyticsHeatmapCell | null>((best, cell) => {
    if (!best || cell.value < best.value) return cell;
    return best;
  }, null);

  return (
    <SectionCard title="حرارة النشاط (آخر 24 شهر)" description="أكثر الأشهر نشاطًا وأشهر الركود">
      {heatmap.length === 0 ? (
        <div className="text-sm text-slate-500">لا توجد بيانات للفترة المحددة.</div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
              أكثر أشهر النشاط: {mostActive && mostActive.value > 0 ? `${mostActive.label} (${mostActive.value})` : "—"}
            </div>
            <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
              أشهر الركود: {leastActive ? `${leastActive.label} (${leastActive.value})` : "—"}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm border border-slate-100 bg-blue-200" />
              نشاط منخفض
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm border border-slate-100 bg-blue-300" />
              نشاط متوسط
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm border border-slate-100 bg-blue-600" />
              نشاط مرتفع
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-12">
            {heatmap.map((cell) => (
              <div
                key={cell.key}
                title={`${cell.label} — ${cell.value} أنشطة`}
                className={`h-10 rounded-md border border-slate-100 ${getIntensity(cell.value, max)}`}
              >
                <div className="text-[10px] text-slate-700 text-center pt-2">{cell.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
