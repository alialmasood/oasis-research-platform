import { redirect } from "next/navigation";
import { parseISO } from "date-fns";
import { getSessionUser } from "@/lib/middleware";
import { getAnalyticsPayload } from "@/lib/analytics/analyticsRepo";
import type { AnalyticsFilters } from "@/lib/analytics/analyticsTypes";
import { FiltersBar } from "./_components/FiltersBar";
import { KpiCards } from "./_components/KpiCards";
import { ExportReportButton } from "./_components/ExportReportButton";
import { ChartsOverview } from "./_components/ChartsOverview";
import { ChartsActivities } from "./_components/ChartsActivities";
import { ChartsConferences } from "./_components/ChartsConferences";
import { ChartsPublications } from "./_components/ChartsPublications";
import { ChartsPerformance } from "./_components/ChartsPerformance";
import { HeatmapCalendar } from "./_components/HeatmapCalendar";
import { ComparisonPanel } from "./_components/ComparisonPanel";
import { InsightsPanel } from "./_components/InsightsPanel";

function safeParseDate(value?: string) {
  if (!value) return null;
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

type AnalyticsSearchParams = {
  from?: string;
  to?: string;
  granularity?: string;
  compare?: string;
  compareFrom?: string;
  compareTo?: string;
};

export default async function ResearcherAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.roles.includes("RESEARCHER")) {
    redirect("/login");
  }

  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), 0, 1);
  const defaultTo = today;

  const from = safeParseDate(resolvedSearchParams?.from) ?? defaultFrom;
  const to = safeParseDate(resolvedSearchParams?.to) ?? defaultTo;
  const granularity = resolvedSearchParams?.granularity === "year" ? "year" : "month";
  const compare = resolvedSearchParams?.compare === "1";
  const compareFrom = safeParseDate(resolvedSearchParams?.compareFrom) ?? undefined;
  const compareTo = safeParseDate(resolvedSearchParams?.compareTo) ?? undefined;

  const filters: AnalyticsFilters = {
    from,
    to,
    granularity,
    compareFrom: compare ? compareFrom : undefined,
    compareTo: compare ? compareTo : undefined,
  };

  const payload = await getAnalyticsPayload(user.id, filters);

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">التحليلات الزمنية</h1>
        <p className="text-sm text-slate-500 mt-1">لوحة تحليل احترافية لنشاطك الأكاديمي عبر الزمن.</p>
      </div>

      <div className="sticky top-4 z-20 rounded-2xl border border-slate-100 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm">
        <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <a href="#filters" className="rounded-full px-3 py-1 hover:bg-slate-100">الفلاتر</a>
          <a href="#kpis" className="rounded-full px-3 py-1 hover:bg-slate-100">المؤشرات</a>
          <a href="#charts" className="rounded-full px-3 py-1 hover:bg-slate-100">الرسوم</a>
          <a href="#insights" className="rounded-full px-3 py-1 hover:bg-slate-100">الملخص</a>
        </nav>
      </div>

      <div id="filters">
        <FiltersBar
          initialFrom={from.toISOString().slice(0, 10)}
          initialTo={to.toISOString().slice(0, 10)}
          initialGranularity={granularity}
          initialCompare={compare}
          initialCompareFrom={compareFrom?.toISOString().slice(0, 10)}
          initialCompareTo={compareTo?.toISOString().slice(0, 10)}
        />
      </div>

      <div className="flex justify-end">
        <ExportReportButton
          kpis={payload.kpis}
          timeline={payload.timeline}
          insights={payload.insights}
          from={from.toISOString().slice(0, 10)}
          to={to.toISOString().slice(0, 10)}
          granularity={granularity}
        />
      </div>

      <div id="kpis">
        <KpiCards kpis={payload.kpis} />
      </div>

      <div id="charts" className="space-y-6">
        <ChartsOverview timeline={payload.timeline} />
        <ChartsActivities timeline={payload.timeline} />
        <ChartsPerformance data={payload.performance} />
        <ChartsConferences data={payload.conferences} />
        <ChartsPublications data={payload.publications} />
        <HeatmapCalendar heatmap={payload.heatmap} />
        <ComparisonPanel compare={payload.compare} />
      </div>

      <div id="insights">
        <InsightsPanel insights={payload.insights} />
      </div>
    </div>
  );
}
