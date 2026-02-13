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
  const hasYearlyData = yearlyData.length > 0 && yearlyData.some((item) => 
    (item.مخطط || 0) + (item.منجز || 0) + (item.منشور || 0) + (item["غير منجز"] || 0) > 0
  );
  const hasIndexingData = indexingData.length > 0 && indexingData.some((item) => item.value > 0);
  const hasMonthlyData = monthlyData.length > 0 && monthlyData.some((item) => (item.نشاطات || 0) > 0);
  const hasActivitiesDistribution = activitiesDistributionData.length > 0 && activitiesDistributionData.some((item) => item.value > 0);
  const hasYearlyActivities = yearlyActivitiesData.length > 0 && yearlyActivitiesData.some((item) => 
    (item.مؤتمرات || 0) + (item.ندوات || 0) + (item.دورات || 0) + (item.ورش || 0) > 0
  );

  const showResearchCharts = selectedType === "all" || selectedType === "research";
  const showActivitiesCharts = selectedType === "all" || selectedType === "activities";
  const isMobile = useIsMobile();

  /** موبايل فقط: ارتفاع أقل + tick 10 + legend 11. الديسكتوب: لا تغيير (ارتفاع 320، خط عادي) */
  const chartHeightClass = "h-[180px] sm:h-[220px] md:h-[320px]";
  const lineChartHeightClass = "h-[180px] sm:h-[220px] md:h-[320px]";
  const tickFontSize = isMobile ? 10 : 12;
  const legendWrapperStyle = isMobile ? { fontSize: 11 } : undefined;
  /** الديسكتوب: Pie مع ليجند عمودي على اليمين. الموبايل: ليجند أفقي تحت */
  const pieLegendLayout = isMobile ? "horizontal" : "vertical";
  const pieLegendVerticalAlign = isMobile ? "bottom" : "middle";

  return (
    <>
      {/* رسوم البحوث - عمود واحد بالموبايل */}
      {showResearchCharts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 col-span-12">
          <Card className="border-slate-100 bg-white shadow-lg rounded-2xl p-3 md:p-6">
            <CardHeader className="pb-2 pt-0 px-0 md:pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">
                حالة البحوث حسب السنوات
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
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

          <Card className="border-slate-100 bg-white shadow-lg rounded-2xl p-3 md:p-6">
            <CardHeader className="pb-2 pt-0 px-0 md:pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">
                توزيع الفهرسة
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
              <div className={chartHeightClass}>
                {hasIndexingData ? (
                  <PieChart
                    data={indexingData}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    legendWrapperStyle={legendWrapperStyle}
                    outerRadius={80}
                    innerRadius={28}
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

      {/* رسوم النشاطات الأكاديمية */}
      {showActivitiesCharts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 col-span-12">
          <Card className="border-slate-100 bg-white shadow-lg rounded-2xl p-3 md:p-6">
            <CardHeader className="pb-2 pt-0 px-0 md:pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">
                النشاطات الأكاديمية حسب السنوات
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
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

          <Card className="border-slate-100 bg-white shadow-lg rounded-2xl p-3 md:p-6">
            <CardHeader className="pb-2 pt-0 px-0 md:pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">
                توزيع النشاطات الأكاديمية
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
              <div className={chartHeightClass}>
                {hasActivitiesDistribution ? (
                  <PieChart
                    data={activitiesDistributionData}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    legendWrapperStyle={legendWrapperStyle}
                    outerRadius={80}
                    innerRadius={28}
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

      {/* النشاط الشهري (عام) */}
      <div className="col-span-12">
        <Card className="border-slate-100 bg-white shadow-lg rounded-2xl p-3 md:p-6">
          <CardHeader className="pb-2 pt-0 px-0 md:pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">
              النشاط الشهري
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className={lineChartHeightClass}>
              {hasMonthlyData ? (
                <LineChart
                  data={monthlyData}
                  dataKeys={[{ key: "نشاطات", stroke: "#2563EB" }]}
                  showDots={true}
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
