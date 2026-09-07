import type { AnalyticsInsights } from "@/lib/analytics/analyticsTypes";
import { AlertTriangle, TrendingUp, Star, Lightbulb } from "lucide-react";
import { SectionCard } from "./SectionCard";

type InsightsPanelProps = {
  insights: AnalyticsInsights;
};

const signalCards = [
  {
    key: "warning" as const,
    label: "تنبيه",
    icon: AlertTriangle,
    tone: "border-amber-200 bg-amber-50/70",
    iconTone: "bg-amber-100 text-amber-700",
  },
  {
    key: "growth" as const,
    label: "النمو",
    icon: TrendingUp,
    tone: "border-emerald-200 bg-emerald-50/70",
    iconTone: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "highlight" as const,
    label: "أبرز نقطة",
    icon: Star,
    tone: "border-blue-200 bg-blue-50/70",
    iconTone: "bg-blue-100 text-blue-700",
  },
];

export function InsightsPanel({ insights }: InsightsPanelProps) {
  const texts = {
    warning: insights.warningText,
    growth: insights.growthText,
    highlight: insights.highlightText,
  };

  return (
    <SectionCard
      title="ملخص وتحليلات"
      description="اقرأ الإشارة الأهم أولًا، ثم نفّذ التوصيات العملية للفترة الحالية."
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {signalCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                className={`rounded-2xl border px-4 py-3.5 flex flex-col gap-3 h-full ${card.tone}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${card.iconTone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-xs font-semibold text-slate-600">{card.label}</p>
                </div>
                <p className="text-sm font-semibold text-slate-900 leading-relaxed">{texts[card.key]}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600">
              <Lightbulb className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">توصيات سريعة</p>
              <p className="text-[11px] text-slate-500">خطوات عملية لرفع نشاطك في الفترة القادمة</p>
            </div>
          </div>
          {insights.recommendations.length === 0 ? (
            <p className="text-sm text-slate-500">لا توجد توصيات حالياً.</p>
          ) : (
            <ol className="grid gap-2 sm:grid-cols-2">
              {insights.recommendations.map((rec, index) => (
                <li
                  key={rec}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5"
                >
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
                    {index + 1}
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed pt-0.5">{rec}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
