"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { EmptyChartState } from "@/app/researcher/dashboard/_components/EmptyChartState";
import type { ResearchStats } from "@/lib/research/researchStats";

const PUBLISH_TYPE_LABELS: Record<string, string> = {
  journal: "مجلة",
  conference: "مؤتمر",
  bookChapter: "فصل كتاب",
  report: "تقرير",
  other: "أخرى",
};

const RESEARCH_TYPE_LABELS: Record<string, string> = {
  planned: "مخطط",
  unplanned: "غير مخطط",
};

export function ResearchChartsSection({ stats }: { stats: ResearchStats }) {
  const {
    totals,
    byYear,
    byStatus,
    byPublishStatus,
    byPublishType,
    byResearchType,
    scopusQuartiles,
  } = stats;

  // كل قيم الرسوم أعداد صحيحة (Integer) — النسبة الوحيدة هي "متوسط الإنجاز" في KPI فقط
  const toInt = (n: number) => Math.round(Number(n));

  // مفتاح القيمة في الرسوم الشريطية — يظهر في التسمية/الأداة (عدد الأبحاث)
  const COUNT_KEY = "عدد الأبحاث";

  // byYear: Array<{ year: number; count: number }>
  const byYearData = byYear.map(({ year, count }) => ({
    name: String(year),
    [COUNT_KEY]: toInt(count),
  }));
  const hasByYear = byYearData.length > 0;

  // byStatus: { completed, inProgress }
  const completedVsInProgressData = [
    { name: "منجز", value: toInt(byStatus.completed), color: "#10b981" },
    { name: "غير منجز", value: toInt(byStatus.inProgress), color: "#f59e0b" },
  ].filter((d) => d.value > 0);
  const hasCompletedVsInProgress = completedVsInProgressData.length > 0;

  // byPublishStatus: { published, unpublished }
  const publishedVsUnpublishedData = [
    { name: "منشور", [COUNT_KEY]: toInt(byPublishStatus.published) },
    { name: "غير منشور", [COUNT_KEY]: toInt(byPublishStatus.unpublished) },
  ];
  const hasPublishedVsUnpublished = publishedVsUnpublishedData.some((d) => d[COUNT_KEY] > 0);

  // byPublishType: { journal, conference, bookChapter, report, other }
  const publishTypeData = Object.entries(byPublishType)
    .filter(([_, count]) => count > 0)
    .map(([k, v]) => ({
      name: PUBLISH_TYPE_LABELS[k] ?? k,
      [COUNT_KEY]: toInt(v),
    }));
  const hasPublishType = publishTypeData.length > 0;

  // تجهيز Q1..Q4 دائمًا حتى لو صفر
  const scopusData = [
    { name: "Q1", [COUNT_KEY]: toInt(stats.scopusQuartiles?.Q1 ?? 0) },
    { name: "Q2", [COUNT_KEY]: toInt(stats.scopusQuartiles?.Q2 ?? 0) },
    { name: "Q3", [COUNT_KEY]: toInt(stats.scopusQuartiles?.Q3 ?? 0) },
    { name: "Q4", [COUNT_KEY]: toInt(stats.scopusQuartiles?.Q4 ?? 0) },
  ];
  // الرسم يعرض دائمًا (Q1..Q4 موجودة دائمًا حتى لو صفر)

  // مخطط مقابل غير مخطط (من byResearchType)
  const plannedVsUnplannedData = [
    { name: "مخطط", value: toInt(byResearchType.planned), color: "#f59e0b" },
    { name: "غير مخطط", value: toInt(byResearchType.unplanned), color: "#10b981" },
  ].filter((d) => d.value > 0);
  const hasPlannedVsUnplanned = plannedVsUnplannedData.length > 0;

  // byResearchType: { planned, unplanned } - للرسم Bar
  const byResearchTypeData = Object.entries(byResearchType)
    .filter(([_, count]) => count > 0)
    .map(([k, v]) => ({
      name: RESEARCH_TYPE_LABELS[k] ?? k,
      [COUNT_KEY]: toInt(v),
    }));
  const hasByResearchType = byResearchTypeData.length > 0;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">الرسوم البيانية</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* byYear (bar) */}
        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">حسب السنة</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "220px" }}>
              {hasByYear ? (
                <BarChart data={byYearData} dataKeys={[COUNT_KEY]} colors={["#2563EB"]} />
              ) : (
                <EmptyChartState type="bar" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* completed vs inProgress (pie) */}
        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">منجز مقابل غير منجز</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "220px" }}>
              {hasCompletedVsInProgress ? (
                <PieChart data={completedVsInProgressData} />
              ) : (
                <EmptyChartState type="pie" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* published vs unpublished (bar) */}
        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">منشور مقابل غير منشور</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "220px" }}>
              {hasPublishedVsUnpublished ? (
                <BarChart
                  data={publishedVsUnpublishedData}
                  dataKeys={[COUNT_KEY]}
                  colors={["#8b5cf6", "#94a3b8"]}
                />
              ) : (
                <EmptyChartState type="bar" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* نوع النشر (bar) */}
        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">نوع النشر</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "220px" }}>
              {hasPublishType ? (
                <BarChart
                  data={publishTypeData}
                  dataKeys={[COUNT_KEY]}
                  colors={["#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]}
                />
              ) : (
                <EmptyChartState type="bar" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* scopus quartiles (bar) — Q1..Q4 دائمًا معروضة حتى لو صفر */}
        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">سكوبس حسب الربع</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "220px" }}>
              <BarChart
                data={scopusData}
                dataKeys={[COUNT_KEY]}
                colors={["#059669", "#0d9488", "#0891b2", "#06b6d4"]}
              />
            </div>
          </CardContent>
        </Card>

        {/* مخطط مقابل غير مخطط (pie) */}
        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">مخطط مقابل غير مخطط</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "220px" }}>
              {hasPlannedVsUnplanned ? (
                <PieChart data={plannedVsUnplannedData} />
              ) : (
                <EmptyChartState type="pie" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
