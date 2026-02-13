import {
  CATEGORY_LABELS,
  EVALUATION_CAPS,
  EVALUATION_WEIGHTS,
  INTERNATIONAL_STANDARDS,
  computeOverallScore,
} from "@/app/researcher/evaluation/types";
import type { EvaluationAggregates, GoalsInput } from "@/app/researcher/evaluation/types";

/** نسبة الإنجاز: min(actual/planned, 1)*100 مع معالجة planned=0 */
export function achievementPercentSingle(actual: number, planned: number): number | null {
  if (planned <= 0) return null;
  return Math.min(100, Math.round((actual / planned) * 100));
}

export function buildEvaluationSuggestions(params: {
  aggregates: EvaluationAggregates;
  goals: GoalsInput | null;
  totalScore?: number;
}): string[] {
  const { aggregates, goals } = params;
  const totalScore = params.totalScore ?? computeOverallScore(aggregates);
  const categories = (Object.keys(CATEGORY_LABELS) as (keyof EvaluationAggregates)[]).filter(
    (k) => k in aggregates
  );

  const goalsKeysWithTarget =
    goals != null
      ? categories.filter((key) => ((goals as Record<string, number>)[key] ?? 0) > 0)
      : [];
  const achievementPercent =
    goalsKeysWithTarget.length > 0
      ? Math.round(
          goalsKeysWithTarget.reduce((sum, key) => {
            const g = (goals as Record<string, number>)[key] ?? 0;
            const a = aggregates[key] ?? 0;
            return sum + (achievementPercentSingle(a, g) ?? 0);
          }, 0) / goalsKeysWithTarget.length
        )
      : null;

  const suggestions: string[] = [];
  const researchCap = EVALUATION_CAPS.research;
  const researchWeight = EVALUATION_WEIGHTS.research;
  const researchPointsPerUnit = researchCap > 0 ? Math.round(researchWeight / researchCap) : 0;

  if (totalScore < 70 && (aggregates.research ?? 0) < researchCap) {
    suggestions.push(
      `نشر بحث إضافي في مجلة مفهرسة قد يرفع التقييم بحوالي ${researchPointsPerUnit} نقاط`
    );
  }
  if ((aggregates.research ?? 0) < INTERNATIONAL_STANDARDS.research.min) {
    suggestions.push(
      `استهدف نشر ${INTERNATIONAL_STANDARDS.research.min} بحوث على الأقل سنوياً (كل بحث إضافي ≈ ${researchPointsPerUnit} نقاط)`
    );
  }
  if ((aggregates.conferences ?? 0) < INTERNATIONAL_STANDARDS.conferences.min) {
    suggestions.push("المشاركة في مؤتمر دولي واحدة قد ترفع التقييم بحوالي 2 نقطة وتحقّق المعيار الدولي");
  }
  if ((aggregates.supervision ?? 0) < INTERNATIONAL_STANDARDS.supervision.min) {
    suggestions.push("الإشراف على طالب دراسات عليا يرفع التقييم بحوالي 2 نقطة ويحقّق المعيار الدولي");
  }
  if (goals != null && achievementPercent != null && achievementPercent < 80) {
    suggestions.push(
      `إكمال الأهداف المخططة (نسبة الإنجاز الحالية ${achievementPercent}%) قد يرفع التقييم وفق أوزان الفئات`
    );
  }

  goalsKeysWithTarget.forEach((key) => {
    const g = (goals as Record<string, number>)[key] ?? 0;
    const a = aggregates[key] ?? 0;
    const pct = achievementPercentSingle(a, g);
    const w = EVALUATION_WEIGHTS[key];
    const cap = EVALUATION_CAPS[key];
    const estPoints = cap > 0 ? Math.round(w / cap) : 0;
    if (pct != null && pct < 70) {
      suggestions.push(
        `تحسين إنجاز «${CATEGORY_LABELS[key]}» (${a} من ${g} = ${pct}%): إضافة نشاط قد ≈ ${estPoints} نقاط`
      );
    }
  });

  if (suggestions.length === 0) {
    suggestions.push("حافظ على وتيرة النشاط وحدّث أهداف الخطة السنوية");
  }

  return suggestions;
}
