"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiStrip } from "./KpiStrip";
import { AcademicActivitiesGrid } from "./AcademicActivitiesGrid";
import { FiltersBar } from "./FiltersBar";
import { ChartsPanel } from "./ChartsPanel";
import { EvaluationCard } from "./EvaluationCard";
import { FilteredAcademicActivities } from "./FilteredAcademicActivities";
import { KpiRow } from "./KpiRow";
import { InsightsCard } from "./InsightsCard";
import { RankStatInline } from "./RankStatInline";
import { Trophy, Award, Medal, Download, Printer } from "lucide-react";
import { ActivityTimeline } from "./ActivityTimeline";
import { AnnualProgressCard } from "./AnnualProgressCard";
import { statsToKpis, activitiesToKpis } from "../_data/mockData";
import type { ResearchSummaryStats } from "@/lib/research/researchDashboardStats";
import type { AcademicActivityStats } from "@/lib/researcherAcademicStats";
import { onDashboardUpdate } from "@/lib/dashboardSync";
import type { DashboardChartsData } from "@/lib/dashboardCharts";
import type { AnnualProgressData } from "@/lib/annualProgress";
import type { TimelineActivity } from "@/lib/recentActivities";
import type { WeeklyTask } from "@/lib/weeklyPlan";
import { PieChart } from "@/components/charts/pie-chart";
import { EmptyChartState } from "./EmptyChartState";
import { getAcademicYearLabel } from "@/lib/academicYear";

type DashboardClientProps = {
  initialYear: string;
  initialMonth: string;
  initialType: string;
  initialAvailableYears: string[];
  initialAvailableMonths: string[];
  initialResearchStats: {
    lifetime: ResearchSummaryStats;
    filtered: ResearchSummaryStats;
  };
  initialAcademicStats: {
    lifetime: AcademicActivityStats;
    filtered: AcademicActivityStats;
  };
  initialCharts: DashboardChartsData;
  initialOverallCharts: DashboardChartsData;
  initialAnnualProgress: AnnualProgressData;
  initialRecentActivities: TimelineActivity[];
  initialEvaluation: { score: number; suggestions: string[] };
  initialWeeklyPlan: WeeklyTask[];
  initialPointsScore: number;
};

export function DashboardClient({
  initialYear,
  initialMonth,
  initialType,
  initialAvailableYears,
  initialAvailableMonths,
  initialResearchStats,
  initialAcademicStats,
  initialCharts,
  initialOverallCharts,
  initialAnnualProgress,
  initialRecentActivities,
  initialEvaluation,
  initialWeeklyPlan,
  initialPointsScore,
}: DashboardClientProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedType, setSelectedType] = useState(initialType);
  const [availableYears, setAvailableYears] = useState(initialAvailableYears);
  const [availableMonths, setAvailableMonths] = useState(initialAvailableMonths);
  const [lifetimeResearchStats, setLifetimeResearchStats] = useState(
    initialResearchStats.lifetime
  );
  const [lifetimeAcademicStats, setLifetimeAcademicStats] = useState(
    initialAcademicStats.lifetime
  );
  const [filteredResearchStats, setFilteredResearchStats] = useState(
    initialResearchStats.filtered
  );
  const [filteredAcademicStats, setFilteredAcademicStats] = useState(
    initialAcademicStats.filtered
  );
  const [chartsData, setChartsData] = useState(initialCharts);
  const [overallChartsData, setOverallChartsData] = useState(initialOverallCharts);
  const [annualProgress, setAnnualProgress] = useState(initialAnnualProgress);
  const [evaluation, setEvaluation] = useState(initialEvaluation);
  const [weeklyPlan, setWeeklyPlan] = useState(initialWeeklyPlan);
  const [pointsScore, setPointsScore] = useState(initialPointsScore);
  const [isMobile, setIsMobile] = useState(false);

  const handleExportReport = () => {
    const year = selectedYear || new Date().getFullYear().toString();
    window.open(`/researcher/evaluation/print?year=${year}`, "_blank", "noopener,noreferrer");
  };

  const handlePrint = () => {
    const year = selectedYear || new Date().getFullYear().toString();
    const month = selectedMonth && selectedMonth !== "all" ? `&month=${selectedMonth}` : "";
    window.open(`/researcher/evaluation/print?year=${year}${month}`, "_blank", "noopener,noreferrer");
  };

  const refreshAvailableYears = async (signal?: AbortSignal) => {
    const response = await fetch("/api/researcher/dashboard/available-periods", { signal });
    if (!response.ok) return;
    const data = (await response.json()) as { years?: number[] };
    if (data.years) {
      setAvailableYears(data.years.map((y) => String(y)));
    }
  };

  const refreshAvailableMonths = async (signal?: AbortSignal) => {
    if (!selectedYear) return;
    const response = await fetch(
      `/api/researcher/dashboard/available-periods?year=${selectedYear}`,
      { signal }
    );
    if (!response.ok) return;
    const data = (await response.json()) as { months?: number[] };
    if (data.months) {
      setAvailableMonths(data.months.map((m) => String(m)));
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    refreshAvailableYears(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refreshAvailableMonths(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [selectedYear]);

  useEffect(() => {
    if (availableYears.length === 0) {
      if (selectedYear !== "") setSelectedYear("");
      return;
    }
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  useEffect(() => {
    if (selectedMonth === "all") return;
    if (!availableMonths.includes(selectedMonth)) {
      setSelectedMonth("all");
    }
  }, [availableMonths, selectedMonth]);

  const refreshFilteredResearch = async (signal?: AbortSignal) => {
    const query = new URLSearchParams({
      year: selectedYear || "all",
      month: selectedMonth,
      type: selectedType,
    });
    const response = await fetch(`/api/researcher/dashboard/research-stats?${query}`, {
      signal,
    });
    if (!response.ok) return;
    const data = (await response.json()) as { filtered?: ResearchSummaryStats };
    if (data.filtered) setFilteredResearchStats(data.filtered);
  };

  const refreshLifetimeResearch = async (signal?: AbortSignal) => {
    const response = await fetch("/api/researcher/dashboard/research-stats", { signal });
    if (!response.ok) return;
    const data = (await response.json()) as { filtered?: ResearchSummaryStats };
    if (data.filtered) setLifetimeResearchStats(data.filtered);
  };

  const refreshFilteredAcademic = async (signal?: AbortSignal) => {
    const query = new URLSearchParams({
      year: selectedYear || "all",
      month: selectedMonth,
      type: selectedType,
    });
    const response = await fetch(`/api/researcher/dashboard/academic-stats?${query}`, {
      signal,
    });
    if (!response.ok) return;
    const data = (await response.json()) as { filtered?: AcademicActivityStats };
    if (data.filtered) setFilteredAcademicStats(data.filtered);
  };

  const refreshLifetimeAcademic = async (signal?: AbortSignal) => {
    const response = await fetch("/api/researcher/dashboard/academic-stats", { signal });
    if (!response.ok) return;
    const data = (await response.json()) as { filtered?: AcademicActivityStats };
    if (data.filtered) setLifetimeAcademicStats(data.filtered);
  };

  const refreshCharts = async (signal?: AbortSignal) => {
    const query = new URLSearchParams({
      year: selectedYear || "all",
      month: selectedMonth,
      type: selectedType,
    });
    const response = await fetch(`/api/researcher/dashboard/charts?${query}`, { signal });
    if (!response.ok) return;
    const data = (await response.json()) as { charts?: DashboardChartsData };
    if (data.charts) setChartsData(data.charts);
  };

  const refreshOverallCharts = async (signal?: AbortSignal) => {
    const response = await fetch(`/api/researcher/dashboard/charts?type=all`, { signal });
    if (!response.ok) return;
    const data = (await response.json()) as { charts?: DashboardChartsData };
    if (data.charts) setOverallChartsData(data.charts);
  };

  const refreshAnnualProgress = async (signal?: AbortSignal) => {
    const year = selectedYear || new Date().getFullYear().toString();
    const response = await fetch(`/api/researcher/dashboard/annual-progress?year=${year}`, { signal });
    if (!response.ok) return;
    const data = (await response.json()) as { progress?: AnnualProgressData };
    if (data.progress) setAnnualProgress(data.progress);
  };

  const refreshEvaluation = async (signal?: AbortSignal) => {
    const year = selectedYear || "all";
    const response = await fetch(`/api/researcher/dashboard/evaluation?year=${year}`, { signal });
    if (!response.ok) return;
    const data = (await response.json()) as { score?: number; suggestions?: string[] };
    if (typeof data.score === "number" && Array.isArray(data.suggestions)) {
      setEvaluation({ score: data.score, suggestions: data.suggestions });
      setPointsScore(data.score);
    }
  };

  const refreshWeeklyPlan = async (signal?: AbortSignal) => {
    const year = selectedYear || "all";
    const response = await fetch(`/api/researcher/dashboard/weekly-plan?year=${year}`, { signal });
    if (!response.ok) return;
    const data = (await response.json()) as { tasks?: WeeklyTask[] };
    if (Array.isArray(data.tasks)) setWeeklyPlan(data.tasks);
  };

  useEffect(() => {
    const controller = new AbortController();
    refreshFilteredResearch(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [selectedYear, selectedMonth, selectedType]);

  useEffect(() => {
    const controller = new AbortController();
    refreshFilteredAcademic(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [selectedYear, selectedMonth, selectedType]);

  useEffect(() => {
    const controller = new AbortController();
    refreshCharts(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [selectedYear, selectedMonth, selectedType]);

  useEffect(() => {
    const controller = new AbortController();
    refreshOverallCharts(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refreshAnnualProgress(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [selectedYear]);

  useEffect(() => {
    const controller = new AbortController();
    refreshEvaluation(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [selectedYear]);

  useEffect(() => {
    const controller = new AbortController();
    refreshWeeklyPlan(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [selectedYear]);

  useEffect(() => {
    return onDashboardUpdate(() => {
      refreshLifetimeResearch().catch(() => undefined);
      refreshLifetimeAcademic().catch(() => undefined);
      refreshFilteredResearch().catch(() => undefined);
      refreshFilteredAcademic().catch(() => undefined);
      refreshCharts().catch(() => undefined);
      refreshOverallCharts().catch(() => undefined);
      refreshAnnualProgress().catch(() => undefined);
      refreshEvaluation().catch(() => undefined);
      refreshWeeklyPlan().catch(() => undefined);
      refreshAvailableYears().catch(() => undefined);
      refreshAvailableMonths().catch(() => undefined);
    });
  }, [selectedYear, selectedMonth, selectedType]);

  useEffect(() => {
    const m = window.matchMedia("(max-width: 768px)");
    setIsMobile(m.matches);
    const listener = () => setIsMobile(m.matches);
    m.addEventListener("change", listener);
    return () => m.removeEventListener("change", listener);
  }, []);

  const pieLegendLayout = isMobile ? "horizontal" : "vertical";
  const pieLegendVerticalAlign = isMobile ? "bottom" : "middle";
  const legendWrapperStyle = isMobile ? { fontSize: 11 } : undefined;

  // Lifetime stats (لا تتغير)
  const lifetimeResearchKpis = statsToKpis(lifetimeResearchStats);
  const lifetimeActivitiesKpis = activitiesToKpis(lifetimeAcademicStats);

  // Filtered stats (تتغير حسب الفلتر)
  const filteredKpis = statsToKpis(filteredResearchStats);
  const filteredActivitiesKpis = activitiesToKpis(filteredAcademicStats);

  return (
    <div className="w-full max-w-full px-3 sm:px-4 md:px-8 space-y-3 md:space-y-6 dashboard-print-container">
      {/* Welcome Message - عمودي بالموبايل، أفقي بالديسكتوب */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-2">
        <div>
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900">
            مرحبًا بك <span className="font-medium text-slate-800">د. علي حسين مزهر</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-0.5">
            العام الدراسي {getAcademicYearLabel()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm text-slate-600">نقاطك هي</span>
          <span className="text-lg font-bold text-[#2563EB]">{pointsScore}</span>
        </div>
      </div>

      {/* SECTION A: Lifetime Stats */}
      <Card className="border-slate-100 bg-white shadow-lg border-l-4 border-l-blue-500 p-3 md:p-6">
        <CardHeader className="pb-3 px-0 pt-0">
          <div className="flex-1 min-w-0">
            <div className="flex flex-row items-center justify-between gap-2 mb-1">
              <CardTitle className="text-lg md:text-xl font-semibold text-gray-900 min-w-0 order-first">
                الإحصائيات العامة
              </CardTitle>
              {/* أقصى اليسار: ترتيبك (بدون كبسولات، سطر واحد) */}
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 order-last">
                <RankStatInline
                  label="ترتيبك في الجامعة"
                  value={12}
                  icon={<Trophy className="h-3 w-3 md:h-3.5 md:w-3.5" />}
                  tone="amber"
                />
                <RankStatInline
                  label="ترتيبك في الكلية"
                  value={5}
                  icon={<Award className="h-3 w-3 md:h-3.5 md:w-3.5" />}
                  tone="blue"
                />
                <RankStatInline
                  label="ترتيبك في القسم"
                  value={2}
                  icon={<Medal className="h-3 w-3 md:h-3.5 md:w-3.5" />}
                  tone="purple"
                />
              </div>
            </div>
            <CardDescription className="text-sm text-slate-500">
              ملخص كامل لمسيرتك البحثية والأكاديمية منذ بداية مسيرتك الاكاديمية والعلمية
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 px-0 pb-0 pt-0">
          {/* KPI Row */}
          <KpiRow
            currentScore={72.5}
            previousScore={70.0}
            topIndexing="Scopus"
            topActivity="المؤتمرات"
            lastUpdate="منذ يومين"
          />
          {/* Research KPI Strip */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3">
              ملخص البحوث (عام)
            </h3>
            <KpiStrip kpis={lifetimeResearchKpis} />
          </div>

          {/* Academic Activities Grid */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-2 md:mb-3">
              ملخص النشاطات الأكاديمية (عام)
            </h3>
            <AcademicActivitiesGrid activities={lifetimeActivitiesKpis} />
          </div>
        </CardContent>
      </Card>

      {/* الرسوم العامة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 dashboard-print-general-charts">
        <Card className="border-slate-100 bg-white shadow-lg rounded-2xl p-3 md:p-6">
          <CardHeader className="pb-2 pt-0 px-0 md:pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">
              توزيع الفهرسة (عام)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="h-[180px] sm:h-[220px] md:h-[300px]">
              {overallChartsData.indexingData.some((d) => d.value > 0) ? (
                <PieChart
                  data={overallChartsData.indexingData}
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

        <Card className="border-slate-100 bg-white shadow-lg rounded-2xl p-3 md:p-6">
          <CardHeader className="pb-2 pt-0 px-0 md:pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">
              توزيع النشاطات الأكاديمية (عام)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <div className="h-[180px] sm:h-[220px] md:h-[300px]">
              {overallChartsData.activitiesDistributionData.some((d) => d.value > 0) ? (
                <PieChart
                  data={overallChartsData.activitiesDistributionData}
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

      {/* SECTION B: Filtered Stats */}
      <div className="space-y-3 md:space-y-4">
        <Card className="border-slate-100 bg-white shadow-lg border-l-4 border-l-[#2563EB] p-3 md:p-6">
          <CardHeader className="pb-3 px-0 pt-0">
            <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg md:text-xl font-semibold text-gray-900 mb-1">
                  إحصائيات حسب السنة والشهر
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  اختر سنة أو شهر لعرض الأداء التفصيلي.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 print:hidden">
                <Button
                  onClick={handleExportReport}
                  className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-3.5 w-3.5 ml-1.5" />
                  تصدير تقرير السنة
                </Button>
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="h-8 px-3 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <Printer className="h-3.5 w-3.5 ml-1.5" />
                  طباعة
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 px-0 pb-0 pt-0">
            <FiltersBar
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              availableYears={availableYears}
              availableMonths={availableMonths}
              selectedType={selectedType}
              onYearChange={setSelectedYear}
              onMonthChange={setSelectedMonth}
              onTypeChange={setSelectedType}
            />

            {/* ملخص البحوث (حسب الفلتر) - يظهر فقط عند "الكل" أو "بحوث" */}
            {(selectedType === "all" || selectedType === "research") && (
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-2 md:mb-3">
                  ملخص البحوث (حسب الفلتر)
                </h3>
                <KpiStrip kpis={filteredKpis} />
              </div>
            )}

            {/* ملخص النشاطات الأكاديمية (حسب الفلتر) - يظهر فقط عند "الكل" أو "نشاطات" */}
            {(selectedType === "all" || selectedType === "activities") && (
              <FilteredAcademicActivities
                activities={filteredActivitiesKpis}
                year={selectedYear}
                month={selectedMonth}
              />
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6">
          <ChartsPanel
            indexingData={chartsData.indexingData}
            yearlyData={chartsData.yearlyData}
            monthlyData={chartsData.monthlyData}
            activitiesDistributionData={chartsData.activitiesDistributionData}
            yearlyActivitiesData={chartsData.yearlyActivitiesData}
            selectedType={selectedType}
          />
        </div>

        {/* Annual Progress */}
        <AnnualProgressCard
          year={annualProgress.year}
          progress={annualProgress.progress}
          targets={annualProgress.targets}
          onTargetsUpdate={(nextTargets) => {
            setAnnualProgress((prev) => ({
              ...prev,
              targets: nextTargets,
              progress:
                nextTargets.length > 0
                  ? Math.round(
                      (nextTargets.reduce(
                        (sum, t) => sum + Math.min(1, t.current / (t.goal || 1)),
                        0
                      ) /
                        nextTargets.length) *
                        100
                    )
                  : 0,
            }));
          }}
        />
      </div>

      {/* Timeline & Insights - عمود واحد بالموبايل */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6">
        <div className="min-w-0">
          <ActivityTimeline initialActivities={initialRecentActivities} />
        </div>
        <div className="min-w-0">
          <InsightsCard
            suggestions={evaluation.suggestions}
            weeklyTasks={weeklyPlan}
          />
        </div>
      </div>

      {/* Evaluation */}
      <div className="grid grid-cols-1 gap-2 md:gap-6">
        <div className="min-w-0">
          <EvaluationCard score={evaluation.score} suggestions={evaluation.suggestions} />
        </div>
      </div>
    </div>
  );
}
