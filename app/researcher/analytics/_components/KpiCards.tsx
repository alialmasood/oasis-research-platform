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
    { label: "إجمالي النشاط", value: kpis.total, icon: Activity, delta: kpis.growthPct },
    { label: "البحوث (منشورة)", value: kpis.researchPublished, icon: FlaskConical },
    { label: "المؤتمرات", value: kpis.conference, icon: Presentation },
    { label: "الورش", value: kpis.workshop, icon: ClipboardList },
    { label: "اللجان", value: kpis.committee, icon: Users },
  ];

  const renderDelta = (delta?: number) => {
    if (delta === undefined) return <span className="text-xs text-slate-400">— بدون تغيير</span>;
    if (delta > 0) {
      return (
        <span className="text-xs text-emerald-600">
          ↑ {delta}% عن الفترة السابقة
        </span>
      );
    }
    if (delta < 0) {
      return (
        <span className="text-xs text-rose-600">
          ↓ {Math.abs(delta)}% عن الفترة السابقة
        </span>
      );
    }
    return <span className="text-xs text-slate-400">— بدون تغيير</span>;
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-slate-100 bg-white shadow-lg">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <span className="rounded-full bg-slate-100 p-1 text-slate-500">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-2xl font-semibold text-slate-900 mt-2">{item.value}</p>
                <div className="mt-2">{renderDelta(item.delta)}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="border-slate-100 bg-white shadow-lg lg:col-span-3">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-slate-500">المعدل الشهري</p>
              <span className="rounded-full bg-slate-100 p-1 text-slate-500">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{kpis.monthlyRate}</p>
            <div className="mt-2">{renderDelta(kpis.growthPct)}</div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5 shadow-lg lg:col-span-2">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-primary">أفضل فترة ⭐</p>
              <span className="rounded-full bg-primary/10 p-1 text-primary">
                <Star className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{kpis.bestPeriodLabel}</p>
            <p className="text-xs text-slate-500 mt-2">فترة الأداء الأعلى خلال البيانات الحالية.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
