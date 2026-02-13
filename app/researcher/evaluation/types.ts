import type { EvaluationAggregates } from "@/lib/evaluationAggregate";
import type { GoalsInput } from "@/lib/researcherGoalsRepo";

export type { EvaluationAggregates, GoalsInput };

/** أوزان تقريبية لكل فئة (من 100) - قابلة للتعديل لاحقاً */
export const EVALUATION_WEIGHTS: Record<keyof EvaluationAggregates, number> = {
  research: 25,
  conferences: 10,
  seminars: 5,
  workshops: 5,
  courses: 5,
  assignments: 4,
  thankYouLetters: 3,
  committees: 4,
  certificates: 3,
  journals: 5,
  supervision: 10,
  reviewing: 4,
  positions: 3,
  volunteering: 4,
  fieldVisits: 5,
};

/** سقف كل فئة لاحتساب النقاط (أعلى من السقف = وزن كامل) */
export const EVALUATION_CAPS: Record<keyof EvaluationAggregates, number> = {
  research: 8,
  conferences: 6,
  seminars: 6,
  workshops: 4,
  courses: 4,
  assignments: 6,
  thankYouLetters: 4,
  committees: 4,
  certificates: 6,
  journals: 2,
  supervision: 6,
  reviewing: 4,
  positions: 3,
  volunteering: 4,
  fieldVisits: 4,
};

/** حساب الدرجة الإجمالية (0–100) من التجميعات */
export function computeOverallScore(aggregates: EvaluationAggregates): number {
  let total = 0;
  const keys = Object.keys(EVALUATION_WEIGHTS) as (keyof EvaluationAggregates)[];
  for (const key of keys) {
    const cap = EVALUATION_CAPS[key];
    const weight = EVALUATION_WEIGHTS[key];
    const value = aggregates[key] ?? 0;
    const ratio = cap > 0 ? Math.min(1, value / cap) : 0;
    total += ratio * weight;
  }
  return Math.round(Math.min(100, total));
}

/** حدود معايير دولية افتراضية (حد أدنى) */
export const INTERNATIONAL_STANDARDS: Record<string, { min: number; label: string }> = {
  research: { min: 2, label: "بحوث منشورة (حد أدنى 2 سنوياً)" },
  scopus: { min: 1, label: "بحوث في مجلات مفهرسة Scopus (حد أدنى 1)" },
  conferences: { min: 1, label: "مشاركة في مؤتمر دولي (حد أدنى 1)" },
  supervision: { min: 1, label: "إشراف على طالب دراسات عليا (حد أدنى 1)" },
};

export const CATEGORY_LABELS: Record<keyof EvaluationAggregates, string> = {
  research: "بحوث",
  conferences: "مؤتمرات",
  seminars: "ندوات",
  workshops: "ورش عمل",
  courses: "دورات",
  assignments: "تكليفات",
  thankYouLetters: "كتب شكر",
  committees: "لجان",
  certificates: "شهادات مشاركة",
  journals: "إدارة مجلات",
  supervision: "إشراف",
  reviewing: "تقويم علمي",
  positions: "مناصب",
  volunteering: "أعمال طوعية",
  fieldVisits: "زيارات ميدانية",
};
