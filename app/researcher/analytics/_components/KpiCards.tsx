import { Card, CardContent } from "@/components/ui/card";
import type { AnalyticsKpis } from "@/lib/analytics/analyticsTypes";
import {
  Activity,
  FlaskConical,
  Presentation,
  Users,
  ClipboardList,
  Star,
  TrendingUp,
} from "lucide-react";

type KpiCardsProps = {
  kpis: AnalyticsKpis;
};

export function KpiCards({ kpis }: KpiCardsProps) {
  const items = [
    {
      label: "إجمالي النشاط",
      value: kpis.total,
      icon: Activity,
      delta: kpis.growthPct,
      accent: "border-r-slate-500 border-slate-200",
      softBg: "bg-slate-50",
      softText: "text-slate-600",
    },
    {
      label: "البحوث (منشورة)",
      value: kpis.researchPublished,
      icon: FlaskConical,
      accent: "border-r-blue-600 border-blue-200",
      softBg: "bg-blue-50",
      softText: "text-blue-600",
    },
    {
      label: "المؤتمرات",
      value: kpis.conference,
      icon: Presentation,
      accent: "border-r-emerald-500 border-emerald-200",
      softBg: "bg-emerald-50",
      softText: "text-emerald-600",
    },
    {
      label: "الورش",
      value: kpis.workshop,
      icon: ClipboardList,
      accent: "border-r-amber-500 border-amber-200",
      softBg: "bg-amber-50",
      softText: "text-amber-600",
    },
    {
      label: "اللجان",
      value: kpis.committee,
      icon: Users,
      accent: "border-r-sky-500 border-sky-200",
      softBg: "bg-sky-50",
      softText: "text-sky-600",
    },
  ];

  const mobileItems = [
    ...items.map(({ label, value, icon, softBg, softText }) => ({
      label,
      value: String(value),
      icon,
      softBg,
      softText,
    })),
    {
      label: "المعدل الشهري",
      value: String(kpis.monthlyRate),
      icon: TrendingUp,
      softBg: "bg-blue-50",
      softText: "text-blue-600",
    },
  ];

  const renderDelta = (delta?: number) => {
    if (delta === undefined) return <span className="text-xs text-slate-400">— بدون مقارنة</span>;
    if (delta > 0) {
      return <span className="text-xs text-emerald-600">↑ {delta}% عن الفترة السابقة</span>;
    }
    if (delta < 0) {
      return <span className="text-xs text-rose-600">↓ {Math.abs(delta)}% عن الفترة السابقة</span>;
    }
    return <span className="text-xs text-slate-400">— بدون تغيير</span>;
  };

  return (
    <>
      {/* KPI موبايل 2×N */}
      <div className="md:hidden space-y-2">
        <div className="grid grid-cols-2 gap-2">
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
        <div className="h-[64px] rounded-xl border border-amber-100 bg-amber-50/40 px-2.5 py-2 min-w-0 shadow-sm flex items-center">
          <div className="flex items-center gap-2 min-w-0 w-full">
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Star className="h-3.5 w-3.5 text-amber-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-gray-900 leading-none truncate">
                {kpis.bestPeriodLabel}
              </div>
              <p className="mt-1 text-[10px] text-slate-500 leading-tight truncate">أفضل فترة</p>
            </div>
          </div>
        </div>
      </div>

      {/* سطح المكتب — بدون تغيير */}
      <div className="hidden md:block space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className={`border bg-white shadow-sm border-r-4 ${item.accent}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <span className="rounded-full bg-slate-100 p-1.5 text-slate-500">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-slate-900 mt-2">{item.value}</p>
                  {"delta" in item ? <div className="mt-2">{renderDelta(item.delta)}</div> : null}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Card className="border border-slate-200 bg-white shadow-sm border-r-4 border-r-blue-600">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-slate-500">المعدل الشهري</p>
                  <p className="text-2xl font-bold tabular-nums text-slate-900 mt-2">{kpis.monthlyRate}</p>
                </div>
                <span className="rounded-full bg-blue-50 p-1.5 text-blue-600">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2">{renderDelta(kpis.growthPct)}</div>
            </CardContent>
          </Card>
          <Card className="border border-amber-200 bg-amber-50/40 shadow-sm border-r-4 border-r-amber-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-amber-800/80">أفضل فترة</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{kpis.bestPeriodLabel}</p>
                </div>
                <span className="rounded-full bg-amber-100 p-1.5 text-amber-700">
                  <Star className="h-4 w-4" />
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">أعلى أداء ضمن البيانات المعروضة حالياً.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
