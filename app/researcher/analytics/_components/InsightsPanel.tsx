import type { AnalyticsInsights } from "@/lib/analytics/analyticsTypes";
import { AlertTriangle, TrendingUp, Star } from "lucide-react";
import { SectionCard } from "./SectionCard";

type InsightsPanelProps = {
  insights: AnalyticsInsights;
};

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <SectionCard title="ملخص وتحليلات" description="مؤشرات ذكية مباشرة تساعدك على اتخاذ قرار سريع">
      <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5">
        <div className="grid gap-4 text-sm text-slate-800">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <p className="font-semibold text-slate-900">{insights.warningText}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-full bg-emerald-100 p-2 text-emerald-700">
              <TrendingUp className="h-5 w-5" />
            </span>
            <p className="font-semibold text-slate-900">{insights.growthText}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-full bg-yellow-100 p-2 text-yellow-700">
              <Star className="h-5 w-5" />
            </span>
            <p className="font-semibold text-slate-900">{insights.highlightText}</p>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs text-slate-500 mb-2">توصيات سريعة:</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {insights.recommendations.map((rec) => (
            <div key={rec} className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-600">
              {rec}
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
