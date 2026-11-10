"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { LineChart } from "@/components/charts/line-chart";
import { EmptyChartState } from "./EmptyChartState";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 768px)");
    setIsMobile(m.matches);
    const listener = () => setIsMobile(m.matches);
    m.addEventListener("change", listener);
    return () => m.removeEventListener("change", listener);
  }, []);
  return isMobile;
}

interface ChartsPanelProps {
  indexingData: Array<{ name: string; value: number; color: string }>;
  yearlyData: Array<Record<string, any>>;
  monthlyData: Array<Record<string, any>>;
  activitiesDistributionData?: Array<{ name: string; value: number; color: string }>;
  yearlyActivitiesData?: Array<Record<string, any>>;
  selectedType?: string;
}

export function ChartsPanel({
  indexingData,
  yearlyData,
  monthlyData,
  activitiesDistributionData = [],
  yearlyActivitiesData = [],
  selectedType = "all",
}: ChartsPanelProps) {
  const hasYearlyData =
    yearlyData.length > 0 &&
    yearlyData.some(
      (item) =>
        (item.مخطط || 0) + (item.منجز || 0) + (item.منشور || 0) + (item["غير منجز"] || 0) > 0
    );
  const hasIndexingData = indexingData.length > 0 && indexingData.some((item) => item.value > 0);
  const hasMonthlyData = monthlyData.length > 0 && monthlyData.some((item) => (item.نشاطات || 0) > 0);
  const hasActivitiesDistribution =
    activitiesDistributionData.length > 0 &&
    activitiesDistributionData.some((item) => item.value > 0);
  const hasYearlyActivities =
    yearlyActivitiesData.length > 0 &&
    yearlyActivitiesData.some(
      (item) =>
        (item.مؤتمرات || 0) + (item.ندوات || 0) + (item.دورات || 0) + (item.ورش || 0) > 0
    );

  const showResearchCharts = selectedType === "all" || selectedType === "research";
  const showActivitiesCharts = selectedType === "all" || selectedType === "activities";
  const isMobile = useIsMobile();

  const chartHeightClass = "h-[200px] sm:h-[220px] md:h-[320px]";
  const pieHeightClass = "h-[220px] sm:h-[220px] md:h-[320px]";
  const lineChartHeightClass = "h-[200px] sm:h-[220px] md:h-[320px]";
  const tickFontSize = isMobile ? 10 : 12;
  const legendWrapperStyle = isMobile ? { fontSize: 10 } : undefined;
  const pieOuter = isMobile ? 54 : 80;
  const pieInner = isMobile ? 18 : 28;
  // موبايل: بطاقة بعرض الشاشة كاملاً بدون زوايا/حواف جانبية. حاسوب: كما هي
  const cardClass =
    "w-full gap-2 md:gap-6 border-x-0 border-t-0 border-b border-slate-200/80 md:border md:border-slate-100 bg-white shadow-none md:shadow-lg rounded-none md:rounded-2xl p-3 md:p-6 overflow-hidden";
  const titleClass = "text-sm md:text-base font-semibold text-gray-900 leading-snug";

  return (
    <>
      {showResearchCharts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-4 col-span-12">
          <Card className={cardClass}>
            <CardHeader className="pb-1.5 pt-0 px-3 md:px-0 md:pb-3">
              <CardTitle className={titleClass}>حالة البحوث حسب السنوات</CardTitle>
            </CardHeader>
            <CardContent className="px-1 pb-0 pt-0 md:px-0">
              <div className={chartHeightClass}>
                {hasYearlyData ? (
                  <BarChart
                    data={yearlyData}
                    dataKeys={["مخطط", "منجز", "منشور", "غير منجز"]}
                    stackId="research"
                    colors={["#fbbf24", "#10b981", "#2563EB", "#ef4444"]}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={tickFontSize}
                    legendWrapperStyle={legendWrapperStyle}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardHeader className="pb-1.5 pt-0 px-3 md:px-0 md:pb-3">
              <CardTitle className={titleClass}>توزيع الفهرسة</CardTitle>
            </CardHeader>
            <CardContent className="px-1 pb-0 pt-0 md:px-0">
              <div className={pieHeightClass}>
                {hasIndexingData ? (
                  <PieChart
                    data={indexingData}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    legendWrapperStyle={legendWrapperStyle}
                    outerRadius={pieOuter}
                    innerRadius={pieInner}
                    tooltipLabel={(name, value) => `${name}: ${value}`}
                  />
                ) : (
                  <EmptyChartState type="pie" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showActivitiesCharts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-4 col-span-12">
          <Card className={cardClass}>
            <CardHeader className="pb-1.5 pt-0 px-3 md:px-0 md:pb-3">
              <CardTitle className={titleClass}>النشاطات الأكاديمية حسب السنوات</CardTitle>
            </CardHeader>
            <CardContent className="px-1 pb-0 pt-0 md:px-0">
              <div className={chartHeightClass}>
                {hasYearlyActivities ? (
                  <BarChart
                    data={yearlyActivitiesData}
                    dataKeys={["مؤتمرات", "ندوات", "دورات", "ورش"]}
                    stackId="activities"
                    colors={["#2563EB", "#10b981", "#f59e0b", "#ef4444"]}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={tickFontSize}
                    legendWrapperStyle={legendWrapperStyle}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardHeader className="pb-1.5 pt-0 px-3 md:px-0 md:pb-3">
              <CardTitle className={titleClass}>توزيع النشاطات الأكاديمية</CardTitle>
            </CardHeader>
            <CardContent className="px-1 pb-0 pt-0 md:px-0">
              <div className={pieHeightClass}>
                {hasActivitiesDistribution ? (
                  <PieChart
                    data={activitiesDistributionData}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    legendWrapperStyle={legendWrapperStyle}
                    outerRadius={pieOuter}
                    innerRadius={pieInner}
                    tooltipLabel={(name, value) => `${name}: ${value}`}
                  />
                ) : (
                  <EmptyChartState type="pie" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="col-span-12">
        <Card className={cardClass}>
          <CardHeader className="pb-1.5 pt-0 px-3 md:px-0 md:pb-3">
            <CardTitle className={titleClass}>النشاط الشهري</CardTitle>
          </CardHeader>
          <CardContent className="px-1 pb-0 pt-0 md:px-0">
            <div className={lineChartHeightClass}>
              {hasMonthlyData ? (
                <LineChart
                  data={monthlyData}
                  dataKeys={[{ key: "نشاطات", stroke: "#2563EB" }]}
                  showDots={!isMobile}
                  gridOpacity={0.08}
                  tickFontSize={tickFontSize}
                />
              ) : (
                <EmptyChartState type="line" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
