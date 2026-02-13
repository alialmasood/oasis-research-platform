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
  targets: AnnualProgressTarget[];
};

const GOAL_LABELS: Record<string, string> = {
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

  const targets = Object.entries(goals)
    .filter(([, goal]) => (goal ?? 0) > 0)
    .map(([key, goal]) => {
      const current = (aggregates as Record<string, number>)[key] ?? 0;
      return {
        id: key,
        label: GOAL_LABELS[key] ?? key,
        current,
        goal: goal ?? 0,
      };
    })
    .sort((a, b) => b.goal - a.goal)
    .slice(0, 4);

  const progress =
    targets.length > 0
      ? Math.round(
          targets.reduce((sum, t) => sum + Math.min(1, t.current / (t.goal || 1)), 0) /
            targets.length *
            100
        )
      : 0;

  return {
    year: String(year),
    progress,
    targets,
  };
}
