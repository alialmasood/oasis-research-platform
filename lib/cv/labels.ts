/** تسميات عربية موحدة لحقول السيرة الذاتية */

export function arLabel(value: string | null | undefined, map: Record<string, string>): string | undefined {
  if (!value) return undefined;
  if (map[value]) return map[value];
  // قيم عربية مسبقاً
  if (/[\u0600-\u06FF]/.test(value)) return value;
  return map[value] ?? value;
}

export const GENDER_AR: Record<string, string> = {
  MALE: "ذكر",
  FEMALE: "أنثى",
  OTHER: "أخرى",
  ذكر: "ذكر",
  أنثى: "أنثى",
};

export const ASSIGNMENT_STATUS_AR: Record<string, string> = {
  COMPLETED: "منتهي",
  IN_PROGRESS: "غير منتهي",
};

export const COMMITTEE_ROLE_AR: Record<string, string> = {
  MEMBER: "عضو لجنة",
  CHAIRPERSON: "رئيس لجنة",
};

export const PARTICIPATION_AR: Record<string, string> = {
  PRESENTER: "محاضر",
  PARTICIPANT: "مشترك",
  ATTENDEE: "حضور",
  RESEARCHER: "باحث",
};

export const CONFERENCE_SCOPE_AR: Record<string, string> = {
  GLOBAL: "عالمي",
  LOCAL: "محلي",
};

export const RESEARCH_STATUS_AR: Record<string, string> = {
  PLANNED: "مخطط",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتمل",
  DRAFT: "مسودة",
};

export const PUBLISH_STATUS_AR: Record<string, string> = {
  PUBLISHED: "منشور",
  ACCEPTED: "مقبول",
  UNDER_REVIEW: "قيد التحكيم",
  NOT_PUBLISHED: "غير منشور",
};

export const JOURNAL_ROLE_AR: Record<string, string> = {
  EDITOR_IN_CHIEF: "رئيس تحرير",
  ASSOCIATE_EDITOR: "محرر مشارك",
  EDITOR: "محرر",
  REVIEWER: "محكّم",
  MEMBER: "عضو هيئة تحرير",
  BOARD_MEMBER: "عضو هيئة تحرير",
};

export const DEGREE_TYPE_AR: Record<string, string> = {
  PHD: "دكتوراه",
  MASTERS: "ماجستير",
  BACHELORS: "بكالوريوس",
  HIGHER_DIPLOMA: "دبلوم عالي",
};

export const SUPERVISION_TYPE_AR: Record<string, string> = {
  SOLE: "منفرد",
  JOINT: "مشترك",
};

export const PROJECT_STATUS_AR: Record<string, string> = {
  COMPLETED: "مكتمل",
  IN_PROGRESS: "غير مكتمل",
};

export const REVIEWING_TYPE_AR: Record<string, string> = {
  RESEARCHES: "بحوث",
  SCIENTIFIC_ARTICLES: "مقالات علمية",
  THESES: "رسائل وأطاريح",
  PATENTS: "براءات اختراع",
  SCIENTIFIC_CONSULTATIONS: "استشارات علمية",
};

export const REVIEWING_STATUS_AR: Record<string, string> = {
  PLANNED: "مخطط",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتمل",
};

export const VOLUNTEERING_ROLE_AR: Record<string, string> = {
  COORDINATOR: "منسق",
  LEADER: "قائد",
  PARTICIPANT: "مشارك",
  MEMBER: "عضو",
  VOLUNTEER: "متطوع",
};

export const FIELD_VISIT_TYPE_AR: Record<string, string> = {
  FIELD_VISIT_SUPERVISION: "زيارة ميدانية لإشراف الطلبة",
  VOLUNTARY_INSIDE_MINISTRY: "عمل تطوعي داخل الوزارة",
  SERVICE_OUTSIDE_MINISTRY: "خدمة/استشارة خارج الوزارة",
};

export const THANKS_PARTICIPATION_AR: Record<string, string> = {
  PRESENTER: "محاضر",
  PARTICIPANT: "مشترك",
};
