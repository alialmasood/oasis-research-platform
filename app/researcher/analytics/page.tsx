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

function SectionLabel({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">التحليلات الزمنية</h1>
          <p className="text-sm text-slate-500">
            ملخص ذكي أولًا، ثم مؤشرات رقمية، ثم تفاصيل الرسوم حسب نوع النشاط.
          </p>
        </div>
        <ExportReportButton
          kpis={payload.kpis}
          timeline={payload.timeline}
          insights={payload.insights}
          performance={payload.performance}
          publications={payload.publications}
          conferences={payload.conferences}
          heatmap={payload.heatmap}
          compare={payload.compare}
          from={from.toISOString().slice(0, 10)}
          to={to.toISOString().slice(0, 10)}
          granularity={granularity}
        />
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

      <div id="insights">
        <InsightsPanel insights={payload.insights} />
      </div>

      <div id="kpis" className="space-y-3">
        <SectionLabel title="المؤشرات الرئيسية" description="أرقام سريعة تلخّص نشاطك في الفترة المحددة." />
        <KpiCards kpis={payload.kpis} />
      </div>

      <div id="charts" className="space-y-5">
        <SectionLabel
          title="الرسوم والتفاصيل"
          description="ابدأ بالاتجاه العام، ثم وزّع النظر على أنواع النشاط والأداء الزمني."
        />

        <ChartsOverview timeline={payload.timeline} />

        <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
          <ChartsActivities timeline={payload.timeline} />
          <ChartsPerformance data={payload.performance} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
          <ChartsConferences data={payload.conferences} />
          <ChartsPublications data={payload.publications} />
        </div>

        <HeatmapCalendar heatmap={payload.heatmap} />
        <ComparisonPanel compare={payload.compare} />
      </div>
    </div>
  );
}
