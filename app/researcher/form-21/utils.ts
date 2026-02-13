import type { Form21Data, Form21Computed } from "./types";
import { PENALTY_VALUES } from "./types";

/** ترتيب الشهادات من الأعلى إلى الأدنى (كما في السير الذاتي) */
export const DEGREE_ORDER_HIGHEST_FIRST = [
  "BOARD",
  "PHD",
  "MASTERS",
  "BACHELORS",
  "HIGHER_DIPLOMA",
  "DIPLOMA",
] as const;

export const DEGREE_LABELS: Record<string, string> = {
  BOARD: "بورد",
  PHD: "دكتوراه",
  MASTERS: "ماجستير",
  BACHELORS: "بكالوريوس",
  HIGHER_DIPLOMA: "دبلوم عالي",
  DIPLOMA: "دبلوم",
};

/** استخراج أعلى شهادة من قائمة الشهادات العلمية (المدخلة من صفحة السير الذاتي) */
export function getHighestDegreeLabel(
  degrees: { degree: string }[]
): string {
  if (degrees.length === 0) return "";
  const order = DEGREE_ORDER_HIGHEST_FIRST as unknown as string[];
  let bestRank = order.length;
  let best: string | null = null;
  for (const d of degrees) {
    const rank = order.indexOf(d.degree);
    if (rank !== -1 && rank < bestRank) {
      bestRank = rank;
      best = d.degree;
    }
  }
  return best ? DEGREE_LABELS[best] ?? best : "";
}

function axis1Raw(data: Form21Data): number {
  if (data.axis1.notTeaching) return 100;
  const p1 = Math.min(20, data.axis1.coursesCount * 20);
  const p2 =
    data.axis1.surveyPercent >= 80 ? 20 :
    data.axis1.surveyPercent >= 70 ? 17 :
    data.axis1.surveyPercent >= 60 ? 14 :
    data.axis1.surveyPercent >= 50 ? 12 : 8;
  const p3 = data.axis1.p3.filter(Boolean).length * 5;
  const p4 = data.axis1.p4.filter(Boolean).length * 4;
  const p5 = data.axis1.p5.filter(Boolean).length * 4;
  return p1 + p2 + p3 + p4 + p5;
}

function axis2Raw(data: Form21Data): number {
  const cap1 = 40;
  const cap2 = 35;
  const cap3 = 25;
  const v1 = Math.min(cap1, Math.max(0, data.axis2.item1));
  const v2 = Math.min(cap2, Math.max(0, data.axis2.item2));
  const v3 = Math.min(cap3, Math.max(0, data.axis2.item3));
  return v1 + v2 + v3;
}

function axis3Raw(data: Form21Data): number {
  const cap1 = 40;
  const cap2 = 35;
  const cap3 = 25;
  const v1 = Math.min(cap1, Math.max(0, data.axis3.item1));
  const v2 = Math.min(cap2, Math.max(0, data.axis3.item2));
  const v3 = Math.min(cap3, Math.max(0, data.axis3.item3));
  return v1 + v2 + v3;
}

function finalGrade(score: number): string {
  if (score >= 90) return "امتياز";
  if (score >= 80) return "جيد جداً";
  if (score >= 70) return "جيد";
  return "ضعيف";
}

export function computeForm21(data: Form21Data): Form21Computed {
  const axis1RawVal = axis1Raw(data);
  const axis2RawVal = axis2Raw(data);
  const axis3RawVal = axis3Raw(data);
  const axis1Weighted = axis1RawVal * 0.5;
  const axis2Weighted = axis2RawVal * 0.3;
  const axis3Weighted = axis3RawVal * 0.2;
  const axesTotal = axis1Weighted + axis2Weighted + axis3Weighted;
  const strengthScore = Math.min(10, Math.max(0, data.strengthScore));
  const penaltyScore = PENALTY_VALUES[data.penalty];
  const totalBeforePenalty = Math.min(100, axesTotal + strengthScore);
  let finalScore = totalBeforePenalty - penaltyScore;
  const axis2Item1Zero = data.axis2.item1 === 0;
  if (axis2Item1Zero) finalScore = Math.min(finalScore, 75);
  return {
    axis1Raw: axis1RawVal,
    axis2Raw: axis2RawVal,
    axis3Raw: axis3RawVal,
    axis1Weighted,
    axis2Weighted,
    axis3Weighted,
    axesTotal,
    totalBeforePenalty,
    finalScore,
    finalGrade: finalGrade(finalScore),
    penaltyScore,
    axis2Item1Zero,
  };
}

export function formDataFromJson(json: unknown): Form21Data | null {
  try {
    const d = json as Record<string, unknown>;
    if (!d || typeof d !== "object") return null;
    const def = getDefaultForm21Data();
    return {
      basic: { ...def.basic, ...(d.basic as object) },
      axis1: { ...def.axis1, ...(d.axis1 as object) },
      axis2: { ...def.axis2, ...(d.axis2 as object) },
      axis3: { ...def.axis3, ...(d.axis3 as object) },
      strengthScore: Number(d.strengthScore) || 0,
      penalty: (d.penalty as Form21Data["penalty"]) || "none",
    };
  } catch {
    return null;
  }
}

export function getDefaultForm21Data(): Form21Data {
  return {
    basic: {
      university: "",
      college: "",
      department: "",
      fullName: "",
      scientificTitle: "",
      degree: "",
      generalSpecialization: "",
      specificSpecialization: "",
      phone: "",
      email: "",
    },
    axis1: {
      notTeaching: false,
      coursesCount: 0,
      surveyPercent: 0,
      p3: [false, false, false, false],
      p4: [false, false, false, false],
      p5: [false, false, false, false],
    },
    axis2: { item1: 0, item2: 0, item3: 0 },
    axis3: { item1: 0, item2: 0, item3: 0 },
    strengthScore: 0,
    penalty: "none",
  };
}
