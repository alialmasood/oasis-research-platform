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

export type ResearchChartId =
  | "completedVsInProgress"
  | "publishedVsUnpublished"
  | "plannedVsUnplanned";

interface ResearchChartsSectionProps {
  stats: ResearchStats;
  hiddenCharts?: ResearchChartId[];
}

export function ResearchChartsSection({ stats, hiddenCharts = [] }: ResearchChartsSectionProps) {
  const hidden = new Set(hiddenCharts);
  const {
    byYear,
    byPublishStatus,
    byPublishType,
    byResearchType,
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

  const completedVsInProgressData = [
    { name: "منجز", value: toInt(stats.byStatus.completed), color: "#10b981" },
    { name: "غير منجز", value: toInt(stats.byStatus.inProgress), color: "#f59e0b" },
  ].filter((d) => d.value > 0);
  const hasCompletedVsInProgress = completedVsInProgressData.length > 0;

  const publishedVsUnpublishedData = [
    { name: "منشور", [COUNT_KEY]: toInt(byPublishStatus.published) },
    { name: "غير منشور", [COUNT_KEY]: toInt(byPublishStatus.unpublished) },
  ];
  const hasPublishedVsUnpublished = publishedVsUnpublishedData.some((d) => d[COUNT_KEY] > 0);

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

  const chartCardClass =
    "border-slate-100 bg-white shadow-sm md:shadow-lg gap-0 overflow-hidden rounded-xl";
  const chartTitleClass = "text-sm md:text-base font-semibold text-gray-900";
  const chartHeightClass = "h-[180px] md:h-[220px]";
  const showCompleted = !hidden.has("completedVsInProgress");
  const showPlanned = !hidden.has("plannedVsUnplanned");

  return (
    <div className="space-y-2.5 md:space-y-6">
      <h3 className="text-sm md:text-lg font-semibold text-gray-900">الرسوم البيانية</h3>
      <div className="grid gap-2.5 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className={chartCardClass}>
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
            <CardTitle className={chartTitleClass}>حسب السنة</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className={chartHeightClass}>
              {hasByYear ? (
                <BarChart data={byYearData} dataKeys={[COUNT_KEY]} colors={["#2563EB"]} />
              ) : (
                <EmptyChartState type="bar" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* موبايل: البطاقتان الدائريتان متجاورتان */}
        {(showCompleted || showPlanned) && (
          <div className="grid grid-cols-2 gap-2 md:hidden">
            {showCompleted && (
              <Card className={chartCardClass}>
                <CardHeader className="p-2 pb-1">
                  <CardTitle className="text-[11px] font-semibold text-gray-900 leading-tight">
                    منجز / غير منجز
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  <div className="h-[130px]">
                    {hasCompletedVsInProgress ? (
                      <PieChart data={completedVsInProgressData} />
                    ) : (
                      <EmptyChartState type="pie" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            {showPlanned && (
              <Card className={chartCardClass}>
                <CardHeader className="p-2 pb-1">
                  <CardTitle className="text-[11px] font-semibold text-gray-900 leading-tight">
                    مخطط / غير مخطط
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  <div className="h-[130px]">
                    {hasPlannedVsUnplanned ? (
                      <PieChart data={plannedVsUnplannedData} />
                    ) : (
                      <EmptyChartState type="pie" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* حاسوب: منجز مقابل غير منجز */}
        {showCompleted && (
          <Card className={`${chartCardClass} hidden md:block`}>
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">
                منجز مقابل غير منجز
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-[220px]">
                {hasCompletedVsInProgress ? (
                  <PieChart data={completedVsInProgressData} />
                ) : (
                  <EmptyChartState type="pie" />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!hidden.has("publishedVsUnpublished") && (
          <Card className={chartCardClass}>
            <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
              <CardTitle className={chartTitleClass}>منشور مقابل غير منشور</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className={chartHeightClass}>
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
        )}

        <Card className={chartCardClass}>
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
            <CardTitle className={chartTitleClass}>نوع النشر</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className={chartHeightClass}>
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

        <Card className={chartCardClass}>
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
            <CardTitle className={chartTitleClass}>سكوبس حسب الربع</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className={chartHeightClass}>
              <BarChart
                data={scopusData}
                dataKeys={[COUNT_KEY]}
                colors={["#059669", "#0d9488", "#0891b2", "#06b6d4"]}
              />
            </div>
          </CardContent>
        </Card>

        {/* حاسوب: مخطط مقابل غير مخطط */}
        {showPlanned && (
          <Card className={`${chartCardClass} hidden md:block`}>
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">
                مخطط مقابل غير مخطط
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-[220px]">
                {hasPlannedVsUnplanned ? (
                  <PieChart data={plannedVsUnplannedData} />
                ) : (
                  <EmptyChartState type="pie" />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
