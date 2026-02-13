export interface Form21Basic {
  university: string;
  college: string;
  department: string;
  fullName: string;
  scientificTitle: string;
  degree: string;
  generalSpecialization: string;
  specificSpecialization: string;
  phone: string;
  email: string;
}

/** بيانات أساسية مستدعاة من النظام (للقراءة فقط في الاستمارة) */
export type ResearcherBasicFromServer = Form21Basic;

export interface Form21Axis1 {
  notTeaching: boolean;
  coursesCount: number;
  surveyPercent: number;
  p3: [boolean, boolean, boolean, boolean];
  p4: [boolean, boolean, boolean, boolean];
  p5: [boolean, boolean, boolean, boolean];
}

export interface Form21Axis2 {
  item1: number;
  item2: number;
  item3: number;
}

export interface Form21Axis3 {
  item1: number;
  item2: number;
  item3: number;
}

export type PenaltyOption =
  | "none"
  | "notice"    // 3
  | "warning"   // 5
  | "salary_cut" // 7
  | "reprimand"  // 11
  | "salary_reduce" // 13
  | "grade_down";  // 15

export interface Form21Data {
  basic: Form21Basic;
  axis1: Form21Axis1;
  axis2: Form21Axis2;
  axis3: Form21Axis3;
  strengthScore: number;
  penalty: PenaltyOption;
}

export interface Form21Computed {
  axis1Raw: number;
  axis2Raw: number;
  axis3Raw: number;
  axis1Weighted: number;
  axis2Weighted: number;
  axis3Weighted: number;
  axesTotal: number;
  totalBeforePenalty: number;
  finalScore: number;
  finalGrade: string;
  penaltyScore: number;
  axis2Item1Zero: boolean;
}

export const PENALTY_VALUES: Record<PenaltyOption, number> = {
  none: 0,
  notice: 3,
  warning: 5,
  salary_cut: 7,
  reprimand: 11,
  salary_reduce: 13,
  grade_down: 15,
};

export const PENALTY_LABELS: Record<PenaltyOption, string> = {
  none: "لا يوجد",
  notice: "لفت نظر (3)",
  warning: "إنذار (5)",
  salary_cut: "قطع راتب (7)",
  reprimand: "توبيخ (11)",
  salary_reduce: "إنقاص راتب (13)",
  grade_down: "تنزيل درجة (15)",
};
