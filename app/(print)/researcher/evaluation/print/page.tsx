import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { prisma } from "@/lib/db";
import { getAggregatedCounts } from "@/lib/evaluationAggregate";
import { getGoals } from "@/lib/researcherGoalsRepo";
import { computeOverallScore, CATEGORY_LABELS, EVALUATION_CAPS, INTERNATIONAL_STANDARDS } from "@/app/researcher/evaluation/types";
import { buildEvaluationSuggestions, achievementPercentSingle } from "@/lib/evaluationSuggestions";
import { getResearchSummaryStats } from "@/lib/research/researchDashboardStats";
import { getAcademicActivityStats } from "@/lib/researcherAcademicStats";
import { getAnnualProgressData } from "@/lib/annualProgress";
import { getAcademicYearLabel } from "@/lib/academicYear";
import { getDashboardChartsData } from "@/lib/dashboardCharts";
import { PrintClient } from "./PrintClient";

function getGradeLetter(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  if (score >= 50) return "E";
  return "F";
}

function getPerformanceLevelLabel(score: number): string {
  if (score >= 85) return "أعلى من المستوى المطلوب حاليًا";
  if (score >= 70) return "ضمن المستوى المقبول حاليًا";
  if (score >= 55) return "أقل من المستوى المطلوب حاليًا";
  return "دون المستوى المطلوب حاليًا";
}

function getPrimaryReason(aggregates: Record<string, number>): string {
  const entries = (Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[])
    .map((key) => {
      const cap = EVALUATION_CAPS[key];
      if (cap <= 0) return null;
      const value = aggregates[key] ?? 0;
      const ratio = Math.min(1, value / cap);
      return { key, ratio, value, cap };
    })
    .filter(Boolean) as Array<{ key: keyof typeof CATEGORY_LABELS; ratio: number; value: number; cap: number }>;

  if (entries.length === 0) return "لا توجد بيانات كافية لتحديد سبب رئيسي.";
  const lowest = entries.sort((a, b) => a.ratio - b.ratio)[0];
  return `ضعف «${CATEGORY_LABELS[lowest.key]}» (${lowest.value} من ${lowest.cap}).`;
}

export default async function EvaluationPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const resolvedSearchParams = await searchParams;
  const now = new Date();
  const fallbackYear = now.getFullYear();
  const yearParam = resolvedSearchParams.year ?? `${fallbackYear}`;
  const parsedYear = Number(yearParam);
  const yearNumber = Number.isNaN(parsedYear) ? fallbackYear : parsedYear;
  const monthNumber = resolvedSearchParams.month ? Number(resolvedSearchParams.month) : undefined;

  const [profile, aggregates, goals, research, activities, annualProgress, charts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { fullNameAr: true, department: true, entity: true },
    }),
    getAggregatedCounts(user.id, { year: yearNumber, month: monthNumber }),
    getGoals(user.id, yearNumber),
    getResearchSummaryStats(user.id, { year: yearNumber, month: monthNumber }),
    getAcademicActivityStats(user.id, { year: yearNumber, month: monthNumber }),
    getAnnualProgressData(user.id, yearNumber),
    getDashboardChartsData({ userId: user.id, year: yearNumber, month: monthNumber, type: "all" }),
  ]);

  const totalScore = computeOverallScore(aggregates);
  const gradeLetter = getGradeLetter(totalScore);
  const performanceLevel = getPerformanceLevelLabel(totalScore);
  const primaryReason = getPrimaryReason(aggregates);
  const evaluationDate = now.toLocaleDateString("ar-IQ");
  const internationalMet = [
    (aggregates.research ?? 0) >= INTERNATIONAL_STANDARDS.research.min,
    (aggregates.conferences ?? 0) >= INTERNATIONAL_STANDARDS.conferences.min,
    (aggregates.supervision ?? 0) >= INTERNATIONAL_STANDARDS.supervision.min,
  ].every(Boolean);
  const internationalStatus = internationalMet ? "مستوفٍ للحد الأدنى" : "غير مستوفٍ";

  const suggestions = buildEvaluationSuggestions({
    aggregates,
    goals,
    totalScore,
  });

  const detailRows = (Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]).map((key) => {
    const achieved = aggregates[key] ?? 0;
    const goal = (goals as Record<string, number>)[key] ?? 0;
    const pct = achievementPercentSingle(achieved, goal) ?? 0;
    const weight = EVALUATION_CAPS[key] ?? 0;
    return {
      label: CATEGORY_LABELS[key],
      achieved,
      goal,
      pct,
      weight,
      impact: Math.round((Math.min(1, achieved / (EVALUATION_CAPS[key] || 1))) * (weight || 0)),
    };
  });

  return (
    <PrintClient
      header={{
        academicYear: getAcademicYearLabel(
          monthNumber ? new Date(yearNumber, monthNumber - 1, 1) : new Date(yearNumber, 8, 1)
        ),
        researcherName: profile?.fullNameAr ?? user.fullName,
        college: profile?.entity ?? "—",
        department: profile?.department ?? "—",
      }}
      summary={{
        score: totalScore,
        grade: gradeLetter,
        status: performanceLevel,
        reason: primaryReason,
        internationalStatus,
        date: evaluationDate,
      }}
      researchSummary={{
        total: research.total,
        published: research.published,
        scopus: research.scopus,
        thomson: research.thomson,
      }}
      activitiesSummary={{
        conferences: activities.conferences,
        seminars: activities.seminars,
        workshops: activities.workshops,
        committees: activities.committees,
      }}
      detailRows={detailRows}
      standards={[
        {
          label: INTERNATIONAL_STANDARDS.research.label,
          value: aggregates.research ?? 0,
          met: (aggregates.research ?? 0) >= INTERNATIONAL_STANDARDS.research.min,
        },
        {
          label: INTERNATIONAL_STANDARDS.conferences.label,
          value: aggregates.conferences ?? 0,
          met: (aggregates.conferences ?? 0) >= INTERNATIONAL_STANDARDS.conferences.min,
        },
        {
          label: INTERNATIONAL_STANDARDS.supervision.label,
          value: aggregates.supervision ?? 0,
          met: (aggregates.supervision ?? 0) >= INTERNATIONAL_STANDARDS.supervision.min,
        },
      ]}
      annualProgress={annualProgress.progress}
      improvementPlan={suggestions.map((s) => s.replace("قد", "≈"))}
      charts={{
        indexing: charts.indexingData,
        activities: charts.activitiesDistributionData,
      }}
      printDate={evaluationDate}
    />
  );
}
