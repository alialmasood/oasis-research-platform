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
  welcomeName: string;
  welcomeAcademicTitle?: string | null;
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
  initialRanks: { universityRank: number; collegeRank: number; departmentRank: number };
  initialKpiData: {
    currentScore: number;
    previousScore: number;
    topIndexing: string;
    topActivity: string;
    lastUpdate: string;
  };
};

export function DashboardClient({
  welcomeName,
  welcomeAcademicTitle,
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
  initialRanks,
  initialKpiData,
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
  const [ranks, setRanks] = useState(initialRanks);
  const [kpiData, setKpiData] = useState(initialKpiData);
  const [isMobile, setIsMobile] = useState(false);
  const [externalMetrics, setExternalMetrics] = useState<{
    hIndex: number | null;
    citations: number | null;
    publications: number | null;
  }>({ hIndex: null, citations: null, publications: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/researcher/external-metrics", { credentials: "include" });
        if (!res.ok) return;
        const json = await res.json();
        const metrics = json?.metrics;
        if (cancelled || !metrics?.ok) return;
        setExternalMetrics({
          hIndex: typeof metrics.hIndex === "number" ? metrics.hIndex : null,
          citations: typeof metrics.citedByCount === "number" ? metrics.citedByCount : null,
          publications: typeof metrics.publications === "number" ? metrics.publications : null,
        });
      } catch {
        // تجاهل فشل الاستخراج في لوحة التحكم
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleExportReport = () => {
    const year =
      selectedYear && selectedYear !== "all"
        ? selectedYear
        : availableYears[0] || new Date().getFullYear().toString();
    window.open(`/researcher/evaluation/print?year=${year}`, "_blank", "noopener,noreferrer");
  };

  const handlePrint = () => {
    const year =
      selectedYear && selectedYear !== "all"
        ? selectedYear
        : availableYears[0] || new Date().getFullYear().toString();
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
    if (!selectedYear || selectedYear === "all") {
      setAvailableMonths([]);
      return;
    }
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
      if (selectedYear !== "all" && selectedYear !== "") setSelectedYear("all");
      return;
    }
    // Allow "all" (كل السنوات). Only reset when a specific year is invalid.
    if (selectedYear === "all" || selectedYear === "") return;
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear("all");
    }
  }, [availableYears, selectedYear]);

  useEffect(() => {
    // Month filter requires a specific year
    if (selectedYear === "all" || selectedYear === "") {
      if (selectedMonth !== "all") setSelectedMonth("all");
      return;
    }
    if (selectedMonth === "all") return;
    if (!availableMonths.includes(selectedMonth)) {
      setSelectedMonth("all");
    }
  }, [availableMonths, selectedMonth, selectedYear]);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    if (year === "all") setSelectedMonth("all");
  };

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
    const year =
      selectedYear && selectedYear !== "all"
        ? selectedYear
        : availableYears[0] || new Date().getFullYear().toString();
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

  /** هاتف: أقسام بعرض كامل من الجهتين. حاسوب: كما هو */
  const flushBand =
    "w-full px-3 py-4 md:px-0 md:py-0 border-b border-slate-200/70 md:border-0";
  const flushBandEdge =
    "w-full px-0 py-0 md:px-0 md:py-0 border-b border-slate-200/70 md:border-0";
  const flushCard =
    "rounded-none border-0 shadow-none md:rounded-2xl md:border md:border-slate-100 md:shadow-lg overflow-hidden";

  return (
    <div className="w-full max-w-full px-0 md:px-8 space-y-0 md:space-y-6 bg-slate-50/80 md:bg-transparent dashboard-print-container">
      {/* Welcome + metrics — شريط ترحيب بعرض كامل */}
      <section className={`${flushBand} bg-gradient-to-l from-blue-50 via-white to-slate-50 md:bg-none`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-2">
          <div className="min-w-0">
            <h1 className="text-base md:text-2xl font-semibold text-gray-900 leading-snug">
              مرحبًا بك <span className="font-medium text-slate-800">{welcomeName}</span>
            </h1>
            <p className="text-[11px] md:text-base text-muted-foreground mt-0.5 leading-snug">
              {[welcomeAcademicTitle, `العام الدراسي ${getAcademicYearLabel()}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="rounded-xl border border-blue-100/80 bg-white/90 p-2 shadow-sm md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            <div className="grid grid-cols-4 gap-1 md:flex md:items-center md:justify-end md:gap-3 flex-shrink-0">
              <div className="flex flex-col items-center gap-0.5 md:flex-row md:items-center md:gap-2 min-w-0">
                <span className="text-[9px] md:text-sm text-slate-500 whitespace-nowrap leading-none">نقاطك هي</span>
                <span className="text-base md:text-lg font-black tabular-nums text-[#2563EB] leading-none">{pointsScore}</span>
              </div>
              <span className="hidden md:block h-4 w-px bg-slate-200 shrink-0" aria-hidden />
              <div className="flex flex-col items-center gap-0.5 md:flex-row md:items-center md:gap-2 min-w-0 border-r border-slate-100 md:border-0">
                <span className="text-[9px] md:text-sm text-slate-500 whitespace-nowrap leading-none">H-Index</span>
                <span className="text-base md:text-lg font-black tabular-nums text-slate-900 leading-none">
                  {externalMetrics.hIndex ?? "—"}
                </span>
              </div>
              <span className="hidden md:block h-4 w-px bg-slate-200 shrink-0" aria-hidden />
              <div className="flex flex-col items-center gap-0.5 md:flex-row md:items-center md:gap-2 min-w-0 border-r border-slate-100 md:border-0">
                <span className="text-[9px] md:text-sm text-slate-500 whitespace-nowrap leading-none">Citations</span>
                <span className="text-base md:text-lg font-black tabular-nums text-emerald-700 leading-none">
                  {externalMetrics.citations ?? "—"}
                </span>
              </div>
              <span className="hidden md:block h-4 w-px bg-slate-200 shrink-0" aria-hidden />
              <div className="flex flex-col items-center gap-0.5 md:flex-row md:items-center md:gap-2 min-w-0 border-r border-slate-100 md:border-0">
                <span className="text-[9px] md:text-sm text-slate-500 whitespace-nowrap leading-none">Publications</span>
                <span className="text-base md:text-lg font-black tabular-nums text-violet-700 leading-none">
                  {externalMetrics.publications ?? "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION A: Lifetime Stats */}
      <section className={`${flushBand} bg-white overflow-hidden`}>
        <Card className={`${flushCard} gap-2 md:gap-6 bg-transparent md:bg-white border-r-0 border-t-0 md:border-l-4 md:border-l-blue-500 p-0 md:p-6`}>
          <CardHeader className="pb-0 md:pb-3 px-0 pt-0 gap-1.5 md:gap-2">
            <div className="flex-1 min-w-0 space-y-1.5 md:space-y-2">
              {/* موبايل: عنوان ثم شريط ترتيب بسطر واحد */}
              <div className="md:hidden space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-blue-500 shrink-0" aria-hidden />
                  <CardTitle className="text-sm font-semibold text-gray-900 min-w-0">
                    الإحصائيات العامة
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500 leading-snug">
                  ملخص مسيرتك البحثية والأكاديمية
                </CardDescription>
                <div className="flex w-full items-center justify-between gap-1 rounded-xl border border-slate-100 bg-gradient-to-l from-amber-50/80 via-blue-50/50 to-violet-50/80 px-2 py-1.5">
                  <RankStatInline
                    label="ترتيبك في الجامعة"
                    shortLabel="ترتيبك في الجامعة"
                    value={ranks.universityRank}
                    icon={<Trophy className="h-3 w-3" />}
                    tone="amber"
                  />
                  <span className="h-4 w-px bg-slate-200/80 shrink-0" aria-hidden />
                  <RankStatInline
                    label="ترتيبك في الكلية"
                    shortLabel="ترتيبك في الكلية"
                    value={ranks.collegeRank}
                    icon={<Award className="h-3 w-3" />}
                    tone="blue"
                  />
                  <span className="h-4 w-px bg-slate-200/80 shrink-0" aria-hidden />
                  <RankStatInline
                    label="ترتيبك في القسم"
                    shortLabel="ترتيبك في القسم"
                    value={ranks.departmentRank}
                    icon={<Medal className="h-3 w-3" />}
                    tone="purple"
                  />
                </div>
              </div>

              {/* حاسوب: العنوان والترتيب في صف واحد كما كان */}
              <div className="hidden md:block">
                <div className="flex flex-row items-center justify-between gap-2 mb-1">
                  <CardTitle className="text-xl font-semibold text-gray-900 min-w-0">
                    الإحصائيات العامة
                  </CardTitle>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <RankStatInline
                      label="ترتيبك في الجامعة"
                      shortLabel="الجامعة"
                      value={ranks.universityRank}
                      icon={<Trophy className="h-3.5 w-3.5" />}
                      tone="amber"
                    />
                    <RankStatInline
                      label="ترتيبك في الكلية"
                      shortLabel="الكلية"
                      value={ranks.collegeRank}
                      icon={<Award className="h-3.5 w-3.5" />}
                      tone="blue"
                    />
                    <RankStatInline
                      label="ترتيبك في القسم"
                      shortLabel="القسم"
                      value={ranks.departmentRank}
                      icon={<Medal className="h-3.5 w-3.5" />}
                      tone="purple"
                    />
                  </div>
                </div>
                <CardDescription className="text-sm text-slate-500 leading-snug">
                  ملخص كامل لمسيرتك البحثية والأكاديمية منذ بداية مسيرتك الاكاديمية والعلمية
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 px-0 pb-0 pt-0 gap-0">
            <KpiRow
              currentScore={kpiData.currentScore}
              previousScore={kpiData.previousScore}
              topIndexing={kpiData.topIndexing}
              topActivity={kpiData.topActivity}
              lastUpdate={kpiData.lastUpdate}
            />
            <div>
              <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-2 md:mb-3">
                ملخص البحوث (عام)
              </h3>
              <KpiStrip kpis={lifetimeResearchKpis} />
            </div>
            <div className="pt-1">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <span className="md:hidden h-3.5 w-1 rounded-full bg-emerald-500 shrink-0" aria-hidden />
                <h3 className="text-sm md:text-base font-semibold text-gray-800">
                  ملخص النشاطات الأكاديمية (عام)
                </h3>
              </div>
              <AcademicActivitiesGrid activities={lifetimeActivitiesKpis} />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* الرسوم العامة */}
      <section className={`${flushBand} bg-slate-50/90 md:bg-transparent`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 dashboard-print-general-charts">
          <Card className={`${flushCard} bg-white rounded-xl md:rounded-2xl p-3 md:p-6`}>
            <CardHeader className="pb-1.5 pt-0 px-0 md:pb-3">
              <CardTitle className="text-sm md:text-base font-semibold text-gray-900">
                توزيع الفهرسة (عام)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
              <div className="h-[210px] sm:h-[220px] md:h-[300px]">
                {overallChartsData.indexingData.some((d) => d.value > 0) ? (
                  <PieChart
                    data={overallChartsData.indexingData}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    legendWrapperStyle={legendWrapperStyle}
                    outerRadius={isMobile ? 56 : 80}
                    innerRadius={isMobile ? 20 : 28}
                    tooltipLabel={(name, value) => `${name}: ${value}`}
                  />
                ) : (
                  <EmptyChartState type="pie" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={`${flushCard} bg-white rounded-xl md:rounded-2xl p-3 md:p-6`}>
            <CardHeader className="pb-1.5 pt-0 px-0 md:pb-3">
              <CardTitle className="text-sm md:text-base font-semibold text-gray-900">
                توزيع النشاطات الأكاديمية (عام)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
              <div className="h-[210px] sm:h-[220px] md:h-[300px]">
                {overallChartsData.activitiesDistributionData.some((d) => d.value > 0) ? (
                  <PieChart
                    data={overallChartsData.activitiesDistributionData}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    legendWrapperStyle={legendWrapperStyle}
                    outerRadius={isMobile ? 56 : 80}
                    innerRadius={isMobile ? 20 : 28}
                    tooltipLabel={(name, value) => `${name}: ${value}`}
                  />
                ) : (
                  <EmptyChartState type="pie" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION B: Filtered Stats */}
      <section className={`${flushBand} bg-white overflow-hidden`}>
        <Card className={`${flushCard} bg-transparent md:bg-white border-r-0 md:border-l-4 md:border-l-[#2563EB] p-0 md:p-6`}>
          <CardHeader className="pb-2.5 md:pb-3 px-0 pt-0 gap-2">
            <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between md:gap-3">
              <div className="flex items-start justify-between gap-2 w-full md:contents">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="md:hidden h-4 w-1 rounded-full bg-[#2563EB] shrink-0" aria-hidden />
                    <CardTitle className="text-sm md:text-xl font-semibold text-gray-900 mb-0 md:mb-1">
                      إحصائيات حسب السنة والشهر
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[11px] md:text-sm text-slate-500 leading-snug mt-0.5 md:mt-0">
                    اختر سنة أو شهر لعرض الأداء التفصيلي.
                  </CardDescription>
                </div>
                {/* موبايل: أزرار التصدير بنفس سطر العنوان */}
                <div className="flex items-center gap-1 shrink-0 md:hidden print:hidden">
                  <Button
                    onClick={handleExportReport}
                    size="sm"
                    className="h-8 px-2.5 text-[11px] bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="h-3.5 w-3.5 ml-1" />
                    تصدير
                  </Button>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-[11px] border-slate-200 text-slate-700"
                  >
                    <Printer className="h-3.5 w-3.5 ml-1" />
                    طباعة
                  </Button>
                </div>
              </div>
              {/* حاسوب: أزرار التصدير كما كانت */}
              <div className="hidden md:flex md:items-center md:gap-2 flex-shrink-0 print:hidden">
                <Button
                  onClick={handleExportReport}
                  className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-3.5 w-3.5 ml-1" />
                  تصدير تقرير السنة
                </Button>
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="h-8 px-3 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <Printer className="h-3.5 w-3.5 ml-1" />
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
              onYearChange={handleYearChange}
              onMonthChange={setSelectedMonth}
              onTypeChange={setSelectedType}
            />

            {(selectedType === "all" || selectedType === "research") && (
              <div>
                <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-2 md:mb-3">
                  ملخص البحوث (حسب الفلتر)
                </h3>
                <KpiStrip kpis={filteredKpis} />
              </div>
            )}

            {(selectedType === "all" || selectedType === "activities") && (
              <FilteredAcademicActivities
                activities={filteredActivitiesKpis}
                year={selectedYear}
                month={selectedMonth}
                type={selectedType}
              />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Charts — موبايل: امتداد حافة لحافة بدون حشو جانبي */}
      <section className={`${flushBandEdge} bg-slate-50/90 md:bg-transparent`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-6">
          <ChartsPanel
            indexingData={chartsData.indexingData}
            yearlyData={chartsData.yearlyData}
            monthlyData={chartsData.monthlyData}
            activitiesDistributionData={chartsData.activitiesDistributionData}
            yearlyActivitiesData={chartsData.yearlyActivitiesData}
            selectedType={selectedType}
          />
        </div>
      </section>

      {/* Annual Progress */}
      <section className={`${flushBand} bg-white`}>
        <AnnualProgressCard
          year={annualProgress.year}
          progress={annualProgress.progress}
          targets={annualProgress.targets}
          onTargetsUpdate={(nextTargets) => {
            const active = nextTargets.filter((t) => t.goal > 0);
            setAnnualProgress((prev) => ({
              ...prev,
              targets: nextTargets,
              progress:
                active.length > 0
                  ? Math.round(
                      (active.reduce(
                        (sum, t) => sum + Math.min(1, t.current / t.goal),
                        0
                      ) /
                        active.length) *
                        100
                    )
                  : 0,
            }));
          }}
        />
      </section>

      {/* Timeline & Insights */}
      <section className={`${flushBand} bg-amber-50/40 md:bg-transparent`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
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
      </section>

      {/* Evaluation */}
      <section className={`${flushBand} bg-white border-b-0`}>
        <div className="grid grid-cols-1 gap-3 md:gap-6">
          <div className="min-w-0">
            <EvaluationCard score={evaluation.score} suggestions={evaluation.suggestions} />
          </div>
        </div>
      </section>
    </div>
  );
}
