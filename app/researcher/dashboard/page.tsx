import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { getResearchSummaryStats } from "@/lib/research/researchDashboardStats";
import { getAcademicActivityStats } from "@/lib/researcherAcademicStats";
import { getAvailableMonthsForYear, getAvailableYears } from "@/lib/dashboardAvailablePeriods";
import { getDashboardChartsData } from "@/lib/dashboardCharts";
import { getAnnualProgressData } from "@/lib/annualProgress";
import { getRecentActivities } from "@/lib/recentActivities";
import { getAggregatedCounts } from "@/lib/evaluationAggregate";
import { getGoals } from "@/lib/researcherGoalsRepo";
import { computeOverallScore } from "@/app/researcher/evaluation/types";
import { buildEvaluationSuggestions } from "@/lib/evaluationSuggestions";
import { getWeeklyPlan } from "@/lib/weeklyPlan";
import { DashboardClient } from "./_components/DashboardClient";

export default async function ResearcherDashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const availableYears = await getAvailableYears(user.id);
  const initialYear = availableYears[0] != null ? String(availableYears[0]) : "";
  const initialMonth = "all";
  const initialType = "all";

  const lifetime = await getResearchSummaryStats(user.id);
  const filtered = initialYear
    ? await getResearchSummaryStats(user.id, { year: Number(initialYear) })
    : await getResearchSummaryStats(user.id);
  const lifetimeAcademic = await getAcademicActivityStats(user.id);
  const filteredAcademic = initialYear
    ? await getAcademicActivityStats(user.id, { year: Number(initialYear) })
    : await getAcademicActivityStats(user.id);
  const availableMonths = initialYear
    ? await getAvailableMonthsForYear(user.id, Number(initialYear))
    : [];
  const charts = await getDashboardChartsData({
    userId: user.id,
    year: initialYear ? Number(initialYear) : undefined,
    month: undefined,
    type: "all",
  });
  const overallCharts = await getDashboardChartsData({
    userId: user.id,
    type: "all",
  });
  const annualProgress = await getAnnualProgressData(
    user.id,
    initialYear ? Number(initialYear) : new Date().getFullYear()
  );
  const recentActivities = await getRecentActivities(user.id);
  const evaluationAggregates = await getAggregatedCounts(
    user.id,
    initialYear ? { year: Number(initialYear) } : undefined
  );
  const evaluationGoals = initialYear ? await getGoals(user.id, Number(initialYear)) : null;
  const evaluationScore = computeOverallScore(evaluationAggregates);
  const evaluationSuggestions = buildEvaluationSuggestions({
    aggregates: evaluationAggregates,
    goals: evaluationGoals,
    totalScore: evaluationScore,
  });
  const weeklyPlan = await getWeeklyPlan(user.id, initialYear ? Number(initialYear) : undefined);

  return (
    <DashboardClient
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
    />
  );
}
