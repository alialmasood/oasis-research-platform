"use server";

import { getSessionUser } from "@/lib/middleware";
import { getAggregatedCounts, getAvailableYears } from "@/lib/evaluationAggregate";
import * as goalsRepo from "@/lib/researcherGoalsRepo";
import type { GoalsInput } from "@/lib/researcherGoalsRepo";
import type { EvaluationPeriod } from "@/lib/evaluationAggregate";
import type { EvaluationAggregates } from "@/lib/evaluationAggregate";

export type GetEvaluationDataResult = {
  aggregates: EvaluationAggregates;
  goals: GoalsInput | null;
  availableYears: number[];
  period: EvaluationPeriod | null;
  /** بيانات الفترة السابقة للمقارنة (مثلاً السنة السابقة) */
  previousAggregates: EvaluationAggregates | null;
};

export async function getEvaluationData(period?: EvaluationPeriod | null): Promise<GetEvaluationDataResult | { error: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const previousPeriod: EvaluationPeriod | null =
      period?.year != null ? { year: period.year - 1, month: period?.month } : null;

    const [aggregates, availableYears, previousAggregates] = await Promise.all([
      getAggregatedCounts(session.id, period ?? undefined),
      getAvailableYears(session.id),
      previousPeriod ? getAggregatedCounts(session.id, previousPeriod) : Promise.resolve(null),
    ]);

    let goals: GoalsInput | null = null;
    if (period?.year != null) {
      goals = await goalsRepo.getGoals(session.id, period.year);
    }

    return {
      aggregates,
      goals,
      availableYears,
      period: period ?? null,
      previousAggregates,
    };
  } catch (e) {
    console.error("getEvaluationData", e);
    return { error: "فشل في جلب بيانات التقييم" };
  }
}

export async function getGoalsForYear(year: number): Promise<GoalsInput | { error: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };
  try {
    return await goalsRepo.getGoals(session.id, year);
  } catch (e) {
    console.error("getGoalsForYear", e);
    return { error: "فشل في جلب الأهداف" };
  }
}

export async function saveGoals(year: number, goals: GoalsInput): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };
  try {
    await goalsRepo.setGoals(session.id, year, goals);
    return {};
  } catch (e) {
    console.error("saveGoals", e);
    return { error: "فشل في حفظ الأهداف" };
  }
}
