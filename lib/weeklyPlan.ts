import { getAggregatedCounts } from "@/lib/evaluationAggregate";
import { getGoals } from "@/lib/researcherGoalsRepo";
import { CATEGORY_LABELS, EVALUATION_CAPS, INTERNATIONAL_STANDARDS } from "@/app/researcher/evaluation/types";
import type { EvaluationAggregates, GoalsInput } from "@/app/researcher/evaluation/types";

export type WeeklyTask = {
  id: string;
  task: string;
  status: "pending" | "in-progress";
};

function buildTasksFromGoals(aggregates: EvaluationAggregates, goals: GoalsInput | null): WeeklyTask[] {
  if (!goals) return [];
  const categories = Object.keys(CATEGORY_LABELS) as (keyof EvaluationAggregates)[];
  const tasks = categories
    .map((key) => {
      const goal = (goals as Record<string, number>)[key] ?? 0;
      if (goal <= 0) return null;
      const current = aggregates[key] ?? 0;
      const pct = Math.min(1, current / goal);
      const status: WeeklyTask["status"] = pct >= 0.5 ? "in-progress" : "pending";
      const remaining = Math.max(0, goal - current);
      return {
        id: key,
        task: `تحسين إنجاز «${CATEGORY_LABELS[key]}» (المتبقي ${remaining}) خلال هذا الأسبوع`,
        status,
      };
    })
    .filter(Boolean) as WeeklyTask[];
  return tasks;
}

function buildTasksFromCaps(aggregates: EvaluationAggregates): WeeklyTask[] {
  const categories = Object.keys(CATEGORY_LABELS) as (keyof EvaluationAggregates)[];
  const tasks = categories
    .map((key) => {
      const cap = EVALUATION_CAPS[key] ?? 0;
      if (cap <= 0) return null;
      const current = aggregates[key] ?? 0;
      const ratio = Math.min(1, current / cap);
      const status: WeeklyTask["status"] = ratio >= 0.5 ? "in-progress" : "pending";
      return {
        id: key,
        task: `ارفع «${CATEGORY_LABELS[key]}» للوصول إلى الحد المستهدف`,
        status,
        ratio,
      };
    })
    .filter(Boolean) as Array<WeeklyTask & { ratio: number }>;

  return tasks
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 3)
    .map(({ ratio, ...rest }) => rest);
}

export async function getWeeklyPlan(userId: string, year?: number): Promise<WeeklyTask[]> {
  const aggregates = await getAggregatedCounts(userId, year ? { year } : undefined);
  const goals = year ? await getGoals(userId, year) : null;

  const tasks: WeeklyTask[] = [];

  if ((aggregates.research ?? 0) < INTERNATIONAL_STANDARDS.research.min) {
    tasks.push({
      id: "research-standard",
      task: `استهدف رفع عدد البحوث لتحقيق الحد الأدنى (${INTERNATIONAL_STANDARDS.research.min})`,
      status: "pending",
    });
  }
  if ((aggregates.conferences ?? 0) < INTERNATIONAL_STANDARDS.conferences.min) {
    tasks.push({
      id: "conference-standard",
      task: "خطّط للمشاركة في مؤتمر دولي خلال هذا الأسبوع",
      status: "pending",
    });
  }
  if ((aggregates.supervision ?? 0) < INTERNATIONAL_STANDARDS.supervision.min) {
    tasks.push({
      id: "supervision-standard",
      task: "ابحث عن فرصة إشراف لرفع معيار الإشراف",
      status: "pending",
    });
  }

  const goalTasks = buildTasksFromGoals(aggregates, goals);
  tasks.push(...goalTasks);

  const uniqueTasks = tasks.reduce<WeeklyTask[]>((acc, t) => {
    if (!acc.find((x) => x.id === t.id)) acc.push(t);
    return acc;
  }, []);

  if (uniqueTasks.length >= 3) return uniqueTasks.slice(0, 3);

  const fallback = buildTasksFromCaps(aggregates);
  return [...uniqueTasks, ...fallback].slice(0, 3);
}
