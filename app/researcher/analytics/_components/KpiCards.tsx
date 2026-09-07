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
    },
    {
      label: "البحوث (منشورة)",
      value: kpis.researchPublished,
      icon: FlaskConical,
      accent: "border-r-blue-600 border-blue-200",
    },
    {
      label: "المؤتمرات",
      value: kpis.conference,
      icon: Presentation,
      accent: "border-r-emerald-500 border-emerald-200",
    },
    {
      label: "الورش",
      value: kpis.workshop,
      icon: ClipboardList,
      accent: "border-r-amber-500 border-amber-200",
    },
    {
      label: "اللجان",
      value: kpis.committee,
      icon: Users,
      accent: "border-r-sky-500 border-sky-200",
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
    <div className="space-y-4">
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
  );
}
