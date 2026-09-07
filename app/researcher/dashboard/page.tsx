import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";
import { getResearchSummaryStats } from "@/lib/research/researchDashboardStats";
import { getAcademicActivityStats } from "@/lib/researcherAcademicStats";
import { getAvailableYears } from "@/lib/dashboardAvailablePeriods";
import { getDashboardChartsData } from "@/lib/dashboardCharts";
import { getAnnualProgressData } from "@/lib/annualProgress";
import { getRecentActivities } from "@/lib/recentActivities";
import { getAggregatedCounts } from "@/lib/evaluationAggregate";
import { computeOverallScore } from "@/app/researcher/evaluation/types";
import { buildEvaluationSuggestions } from "@/lib/evaluationSuggestions";
import { getWeeklyPlan } from "@/lib/weeklyPlan";
import { getComparisonData } from "@/lib/comparisonRepo";
import { getResearchStats, getTopResearchIndexing } from "@/lib/research/researchStats";
import { getLastActivityUpdate, formatRelativeTime } from "@/lib/lastActivityUpdate";
import { DashboardClient } from "./_components/DashboardClient";

export default async function ResearcherDashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const researcher = await prisma.user.findUnique({
    where: { id: user.id },
    select: { fullNameAr: true, fullNameEn: true, academicTitle: true },
  });
  const welcomeName =
    researcher?.fullNameAr?.trim() ||
    researcher?.fullNameEn?.trim() ||
    user.fullName;
  const welcomeAcademicTitle = researcher?.academicTitle?.trim() || null;

  const availableYears = await getAvailableYears(user.id);
  const initialYear = "all";
  const initialMonth = "all";
  const initialType = "all";

  const lifetime = await getResearchSummaryStats(user.id);
  const filtered = await getResearchSummaryStats(user.id);
  const lifetimeAcademic = await getAcademicActivityStats(user.id);
  const filteredAcademic = await getAcademicActivityStats(user.id);
  const availableMonths: number[] = [];
  const charts = await getDashboardChartsData({
    userId: user.id,
    year: undefined,
    month: undefined,
    type: "all",
  });
  const overallCharts = await getDashboardChartsData({
    userId: user.id,
    type: "all",
  });
  const annualProgress = await getAnnualProgressData(
    user.id,
    availableYears[0] ?? new Date().getFullYear()
  );
  const recentActivities = await getRecentActivities(user.id);
  const evaluationAggregates = await getAggregatedCounts(user.id);
  const evaluationGoals = null;
  const evaluationScore = computeOverallScore(evaluationAggregates);
  const evaluationSuggestions = buildEvaluationSuggestions({
    aggregates: evaluationAggregates,
    goals: evaluationGoals,
    totalScore: evaluationScore,
  });
  const weeklyPlan = await getWeeklyPlan(user.id);

  const comparisonData = await getComparisonData(user.id);
  const ranks = comparisonData.ranks;
  const topActivityLabel = comparisonData.topActivityLabel;

  const baseYear = availableYears[0] ?? new Date().getFullYear();
  const prevYearAggregates = await getAggregatedCounts(user.id, { year: baseYear - 1 });
  const previousScore = computeOverallScore(prevYearAggregates);

  const researchStats = await getResearchStats(user.id);
  const topIndexing = getTopResearchIndexing(researchStats);

  const lastUpdateDate = await getLastActivityUpdate(user.id);
  const lastUpdateLabel = lastUpdateDate ? formatRelativeTime(lastUpdateDate) : "—";

  return (
    <DashboardClient
      welcomeName={welcomeName}
      welcomeAcademicTitle={welcomeAcademicTitle}
      initialYear={initialYear}
      initialMonth={initialMonth}
      initialType={initialType}
      initialAvailableYears={availableYears.map((y) => String(y))}
      initialAvailableMonths={availableMonths.map((m) => String(m))}
      initialResearchStats={{ lifetime, filtered }}
      initialAcademicStats={{ lifetime: lifetimeAcademic, filtered: filteredAcademic }}
      initialCharts={charts}
      initialOverallCharts={overallCharts}
      initialAnnualProgress={annualProgress}
      initialRecentActivities={recentActivities}
      initialEvaluation={{ score: evaluationScore, suggestions: evaluationSuggestions }}
      initialPointsScore={evaluationScore}
      initialWeeklyPlan={weeklyPlan}
      initialRanks={ranks}
      initialKpiData={{
        currentScore: evaluationScore,
        previousScore,
        topIndexing,
        topActivity: topActivityLabel ?? "—",
        lastUpdate: lastUpdateLabel,
      }}
    />
  );
}
