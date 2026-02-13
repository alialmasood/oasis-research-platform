/**
 * تسميات تصنيفات البحوث - مركزية للتحديث في كل الصفحات
 */
export const RESEARCH_CATEGORY_LABELS: Record<string, string> = {
  SCOPUS: "SCOPUS",
  ISI: "ISI (Web of Science)",
  LOCAL: "محلي",
  INTERNATIONAL: "عالمي",
};

/** نص توضيحي لـ ISI للباحثين */
export const ISI_DESCRIPTION =
  "ISI (Web of Science): فهرس مؤسسة المعلومات العلمية يُصنّف المجلات العالمية المحكّمة";

/** تسميات حالة البحث */
export const RESEARCH_STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "غير منجز",
  COMPLETED: "منجز",
};
