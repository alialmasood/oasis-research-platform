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
        <div className="text-xs md:text-sm text-slate-500">لا توجد بيانات للفترة المحددة.</div>
      ) : (
        <div className="space-y-2 md:space-y-4">
          <div className="grid grid-cols-2 gap-1.5 md:gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-2.5 py-2 md:px-3.5 md:py-3 min-h-[64px] h-full">
              <p className="text-[10px] md:text-xs text-slate-500">أكثر الأشهر نشاطًا</p>
              <p className="text-xs md:text-sm font-semibold text-slate-900 mt-1 truncate">
                {mostActive && mostActive.value > 0 ? `${mostActive.label} (${mostActive.value})` : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 px-2.5 py-2 md:px-3.5 md:py-3 min-h-[64px] h-full">
              <p className="text-[10px] md:text-xs text-slate-500">أشهر الركود</p>
              <p className="text-xs md:text-sm font-semibold text-slate-900 mt-1 truncate">
                {leastActive ? `${leastActive.label} (${leastActive.value})` : "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-xs text-slate-600">
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-sm border border-slate-100 bg-blue-200" />
              نشاط منخفض
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-sm border border-slate-100 bg-blue-300" />
              نشاط متوسط
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-sm border border-slate-100 bg-blue-600" />
              نشاط مرتفع
            </div>
          </div>
          <div className="grid grid-cols-6 gap-1 md:gap-2 sm:grid-cols-8 lg:grid-cols-12">
            {heatmap.map((cell) => (
              <div
                key={cell.key}
                title={`${cell.label} — ${cell.value} أنشطة`}
                className={`h-8 md:h-10 rounded-md border border-slate-100 ${getIntensity(cell.value, max)}`}
              >
                <div className="text-[8px] md:text-[10px] text-slate-700 text-center pt-1.5 md:pt-2 truncate px-0.5">
                  {cell.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
