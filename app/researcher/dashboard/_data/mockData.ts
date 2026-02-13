import {
  BookOpen,
  FileCheck,
  CheckCircle2,
  XCircle,
  Globe,
  MapPin,
  User,
  Database,
  Presentation,
  Users,
  GraduationCap,
  Wrench,
  ClipboardList,
  BookOpen as BookIcon,
  Award,
  FileText,
  UserCheck,
  Briefcase,
  Calendar,
  Heart,
  Map,
} from "lucide-react";

// Lifetime Research Stats (لا تتغير أبداً)
export const lifetimeResearchStats = {
  total: "45",
  planned: "12",
  completed: "28",
  published: "22",
  incomplete: "5",
  international: "18",
  local: "27",
  individual: "15",
  scopus: "14",
  thomson: "8",
};

// Lifetime Academic Activities Stats (لا تتغير أبداً)
export const lifetimeAcademicActivities = {
  conferences: "24",
  seminars: "18",
  courses: "12",
  workshops: "8",
  assignments: "15",
  thankYouBooks: "6",
  committees: "10",
  participationCertificates: "32",
  journalManagement: "4",
  studentSupervision: "28",
  positions: "7",
  scientificCalendar: "19",
  volunteerWork: "11",
  fieldVisits: "9",
};

// Filtered Academic Activities Stats (تتغير حسب السنة/الشهر/النوع)
export function getFilteredAcademicStats(year: string, month: string, type: string = "all") {
  // Mock data - في الواقع ستأتي من قاعدة البيانات
  const baseStats = {
    conferences: "6",
    seminars: "4",
    courses: "3",
    workshops: "2",
    assignments: "4",
    thankYouBooks: "1",
    committees: "2",
    participationCertificates: "8",
    journalManagement: "1",
    studentSupervision: "7",
    positions: "2",
    scientificCalendar: "5",
    volunteerWork: "3",
    fieldVisits: "2",
  };

  // تطبيق فلتر النوع
  if (type === "research") {
    // إذا كان الفلتر "بحوث"، نرجع قيم صفرية للنشاطات الأكاديمية
    return {
      conferences: "0",
      seminars: "0",
      courses: "0",
      workshops: "0",
      assignments: "0",
      thankYouBooks: "0",
      committees: "0",
      participationCertificates: "0",
      journalManagement: "0",
      studentSupervision: "0",
      positions: "0",
      scientificCalendar: "0",
      volunteerWork: "0",
      fieldVisits: "0",
    };
  }

  // تعديل بسيط حسب الشهر للتنويع
  if (month !== "all") {
    const monthNum = parseInt(month);
    const multiplier = 1 + (monthNum % 3) * 0.2;
    return {
      conferences: Math.round(parseInt(baseStats.conferences) * multiplier).toString(),
      seminars: Math.round(parseInt(baseStats.seminars) * multiplier).toString(),
      courses: Math.round(parseInt(baseStats.courses) * multiplier).toString(),
      workshops: Math.round(parseInt(baseStats.workshops) * multiplier).toString(),
      assignments: Math.round(parseInt(baseStats.assignments) * multiplier).toString(),
      thankYouBooks: Math.round(parseInt(baseStats.thankYouBooks) * multiplier).toString(),
      committees: Math.round(parseInt(baseStats.committees) * multiplier).toString(),
      participationCertificates: Math.round(parseInt(baseStats.participationCertificates) * multiplier).toString(),
      journalManagement: Math.round(parseInt(baseStats.journalManagement) * multiplier).toString(),
      studentSupervision: Math.round(parseInt(baseStats.studentSupervision) * multiplier).toString(),
      positions: Math.round(parseInt(baseStats.positions) * multiplier).toString(),
      scientificCalendar: Math.round(parseInt(baseStats.scientificCalendar) * multiplier).toString(),
      volunteerWork: Math.round(parseInt(baseStats.volunteerWork) * multiplier).toString(),
      fieldVisits: Math.round(parseInt(baseStats.fieldVisits) * multiplier).toString(),
    };
  }

  return baseStats;
}

// Filtered Research Stats (تتغير حسب السنة/الشهر/النوع)
export function getFilteredResearchStats(year: string, month: string, type: string = "all") {
  // Mock data - في الواقع ستأتي من قاعدة البيانات
  const baseStats = {
    total: "12",
    planned: "3",
    completed: "7",
    published: "5",
    incomplete: "2",
    international: "4",
    local: "8",
    individual: "5",
    scopus: "3",
    thomson: "2",
  };

  // تطبيق فلتر النوع
  if (type === "activities") {
    // إذا كان الفلتر "نشاطات"، نرجع قيم صفرية للبحوث
    return {
      total: "0",
      planned: "0",
      completed: "0",
      published: "0",
      incomplete: "0",
      international: "0",
      local: "0",
      individual: "0",
      scopus: "0",
      thomson: "0",
    };
  }

  // تعديل بسيط حسب الشهر للتنويع
  if (month !== "all") {
    const monthNum = parseInt(month);
    const multiplier = 1 + (monthNum % 3) * 0.2;
    return {
      total: Math.round(parseInt(baseStats.total) * multiplier).toString(),
      planned: Math.round(parseInt(baseStats.planned) * multiplier).toString(),
      completed: Math.round(parseInt(baseStats.completed) * multiplier).toString(),
      published: Math.round(parseInt(baseStats.published) * multiplier).toString(),
      incomplete: Math.round(parseInt(baseStats.incomplete) * multiplier).toString(),
      international: Math.round(parseInt(baseStats.international) * multiplier).toString(),
      local: Math.round(parseInt(baseStats.local) * multiplier).toString(),
      individual: Math.round(parseInt(baseStats.individual) * multiplier).toString(),
      scopus: Math.round(parseInt(baseStats.scopus) * multiplier).toString(),
      thomson: Math.round(parseInt(baseStats.thomson) * multiplier).toString(),
    };
  }

  return baseStats;
}

// Charts Data (تتغير حسب السنة/الشهر/النوع)
export function getFilteredChartsData(year: string, month: string, type: string = "all") {
  // بيانات البحوث
  const indexingData = [
    { name: "Scopus", value: 14, color: "#2563EB" },
    { name: "Thomson Reuters", value: 8, color: "#10b981" },
    { name: "غير مفهرس", value: 23, color: "#94a3b8" },
  ];

  const yearlyResearchData = [
    { name: "2022", مخطط: 5, منجز: 3, منشور: 2, "غير منجز": 2 },
    { name: "2023", مخطط: 8, منجز: 6, منشور: 5, "غير منجز": 2 },
    { name: "2024", مخطط: 12, منجز: 10, منشور: 8, "غير منجز": 2 },
    { name: "2025", مخطط: 15, منجز: 9, منشور: 7, "غير منجز": 6 },
  ];

  // بيانات النشاطات الأكاديمية
  const yearlyActivitiesData = [
    { name: "2022", مؤتمرات: 4, ندوات: 3, دورات: 2, ورش: 1 },
    { name: "2023", مؤتمرات: 6, ندوات: 5, دورات: 3, ورش: 2 },
    { name: "2024", مؤتمرات: 8, ندوات: 6, دورات: 4, ورش: 3 },
    { name: "2025", مؤتمرات: 6, ندوات: 4, دورات: 3, ورش: 2 },
  ];

  const activitiesDistributionData = [
    { name: "مؤتمرات", value: 24, color: "#2563EB" },
    { name: "ندوات", value: 18, color: "#10b981" },
    { name: "دورات", value: 12, color: "#f59e0b" },
    { name: "ورش عمل", value: 8, color: "#ef4444" },
    { name: "أخرى", value: 15, color: "#8b5cf6" },
  ];

  const monthlyActivity = [
    { name: "يناير", نشاطات: 8 },
    { name: "فبراير", نشاطات: 12 },
    { name: "مارس", نشاطات: 10 },
    { name: "أبريل", نشاطات: 15 },
    { name: "مايو", نشاطات: 9 },
    { name: "يونيو", نشاطات: 11 },
    { name: "يوليو", نشاطات: 7 },
    { name: "أغسطس", نشاطات: 13 },
    { name: "سبتمبر", نشاطات: 10 },
    { name: "أكتوبر", نشاطات: 14 },
    { name: "نوفمبر", نشاطات: 8 },
    { name: "ديسمبر", نشاطات: 12 },
  ];

  // تعديل البيانات حسب الشهر المختار
  let adjustedMonthlyActivity = monthlyActivity;
  if (month !== "all") {
    const monthNum = parseInt(month);
    adjustedMonthlyActivity = monthlyActivity.map((item, index) => ({
      ...item,
      نشاطات: index === monthNum - 1 ? item.نشاطات + 5 : item.نشاطات,
    }));
  }

  // تطبيق فلتر النوع
  if (type === "research") {
    // بحوث فقط
    return {
      indexingData,
      yearlyData: yearlyResearchData,
      monthlyData: adjustedMonthlyActivity,
      activitiesDistributionData: [],
      yearlyActivitiesData: [],
    };
  } else if (type === "activities") {
    // نشاطات فقط
    return {
      indexingData: [],
      yearlyData: [],
      monthlyData: adjustedMonthlyActivity,
      activitiesDistributionData,
      yearlyActivitiesData,
    };
  }

  // الكل - كل البيانات
  return {
    indexingData,
    yearlyData: yearlyResearchData,
    monthlyData: adjustedMonthlyActivity,
    activitiesDistributionData,
    yearlyActivitiesData,
  };
}

// Helper function to convert research stats to KPI array
export function statsToKpis(stats: Record<string, string | number>) {
  const getValue = (key: string) => String(stats[key] ?? 0);
  return [
    { label: "إجمالي البحوث", value: getValue("total") },
    { label: "البحوث المخططة", value: getValue("planned") },
    { label: "البحوث المنجزة", value: getValue("completed") },
    { label: "البحوث المنشورة", value: getValue("published") },
    { label: "البحوث غير المنجزة", value: getValue("incomplete") },
    { label: "البحوث العالمية", value: getValue("international") },
    { label: "البحوث المحلية", value: getValue("local") },
    { label: "البحوث المفردة", value: getValue("individual") },
    { label: "Scopus", value: getValue("scopus") },
    { label: "Thomson Reuters", value: getValue("thomson") },
  ];
}

// Helper function to convert academic activities to KPI array
export function activitiesToKpis(activities: Record<string, string | number>) {
  const getValue = (key: string) => String(activities[key] ?? 0);
  return [
    { label: "المؤتمرات", value: getValue("conferences"), icon: Presentation, color: "bg-blue-500" },
    { label: "الندوات", value: getValue("seminars"), icon: Users, color: "bg-green-500" },
    { label: "الدورات", value: getValue("courses"), icon: GraduationCap, color: "bg-purple-500" },
    { label: "ورش العمل", value: getValue("workshops"), icon: Wrench, color: "bg-orange-500" },
    { label: "التكليفات", value: getValue("assignments"), icon: ClipboardList, color: "bg-indigo-500" },
    { label: "كتب الشكر", value: getValue("thankYouBooks"), icon: BookIcon, color: "bg-pink-500" },
    { label: "اللجان", value: getValue("committees"), icon: ClipboardList, color: "bg-cyan-500" },
    { label: "شهادات المشاركة", value: getValue("participationCertificates"), icon: Award, color: "bg-yellow-500" },
    { label: "إدارة المجلات", value: getValue("journalManagement"), icon: FileText, color: "bg-teal-500" },
    { label: "الإشراف على الطلبة", value: getValue("studentSupervision"), icon: UserCheck, color: "bg-amber-500" },
    { label: "المناصب", value: getValue("positions"), icon: Briefcase, color: "bg-red-500" },
    { label: "التقويم العلمي", value: getValue("scientificCalendar"), icon: Calendar, color: "bg-violet-500" },
    { label: "الأعمال الطوعية", value: getValue("volunteerWork"), icon: Heart, color: "bg-rose-500" },
    { label: "الزيارات الميدانية", value: getValue("fieldVisits"), icon: Map, color: "bg-emerald-500" },
  ];
}
