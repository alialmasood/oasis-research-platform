import { getGoals } from "@/lib/researcherGoalsRepo";
import { getAggregatedCounts } from "@/lib/evaluationAggregate";

export type AnnualProgressTarget = {
  id: string;
  label: string;
  current: number;
  goal: number;
};

export type AnnualProgressData = {
  year: string;
  progress: number;
  /** كل فئات الخطة (بما فيها هدف = 0) لاستخدامها في التعديل والعرض */
  targets: AnnualProgressTarget[];
};

export const ANNUAL_GOAL_LABELS: Record<string, string> = {
  research: "البحوث",
  conferences: "المؤتمرات",
  seminars: "الندوات",
  workshops: "ورش العمل",
  courses: "الدورات",
  assignments: "التكليفات",
  thankYouLetters: "كتب الشكر",
  committees: "اللجان",
  certificates: "شهادات المشاركة",
  journals: "إدارة المجلات",
  supervision: "الإشراف على الطلبة",
  reviewing: "التقويم العلمي",
  positions: "المناصب",
  volunteering: "الأعمال الطوعية",
  fieldVisits: "الزيارات الميدانية",
};

export async function getAnnualProgressData(
  userId: string,
  year: number
): Promise<AnnualProgressData> {
  const goals = await getGoals(userId, year);
  const aggregates = await getAggregatedCounts(userId, { year });

  const targets = Object.entries(ANNUAL_GOAL_LABELS).map(([key, label]) => {
    const goal = (goals as Record<string, number>)[key] ?? 0;
    const current = (aggregates as Record<string, number>)[key] ?? 0;
    return { id: key, label, current, goal };
  });

  const activeTargets = targets.filter((t) => t.goal > 0);
  const progress =
    activeTargets.length > 0
      ? Math.round(
          (activeTargets.reduce(
            (sum, t) => sum + Math.min(1, t.current / (t.goal || 1)),
            0
          ) /
            activeTargets.length) *
            100
        )
      : 0;

  return {
    year: String(year),
    progress,
    targets,
  };
}
