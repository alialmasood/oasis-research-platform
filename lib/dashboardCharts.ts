import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type DashboardChartsData = {
  indexingData: Array<{ name: string; value: number; color: string }>;
  yearlyData: Array<Record<string, any>>;
  monthlyData: Array<Record<string, any>>;
  activitiesDistributionData: Array<{ name: string; value: number; color: string }>;
  yearlyActivitiesData: Array<Record<string, any>>;
};

const MONTH_LABELS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

function emptyMonthlyData() {
  return MONTH_LABELS.map((name) => ({ name, نشاطات: 0 }));
}

export async function getDashboardChartsData(params: {
  userId: string;
  year?: number;
  month?: number;
  type?: "all" | "research" | "activities";
}): Promise<DashboardChartsData> {
  const { userId, year, month, type = "all" } = params;
  const showResearch = type === "all" || type === "research";
  const showActivities = type === "all" || type === "activities";

  const activityRange =
    year != null
      ? month != null
        ? {
            gte: new Date(year, month - 1, 1, 0, 0, 0, 0),
            lte: new Date(year, month, 0, 23, 59, 59, 999),
          }
        : {
            gte: new Date(year, 0, 1, 0, 0, 0, 0),
            lte: new Date(year, 11, 31, 23, 59, 59, 999),
          }
      : null;

  const researchWhere: Prisma.ResearchWhereInput = {
    researcherId: userId,
  };
  if (year != null) researchWhere.year = year;
  if (month != null) researchWhere.publishMonth = month;

  const allResearch = showResearch
    ? await prisma.research.findMany({
        where: researchWhere,
        select: {
          year: true,
          researchType: true,
          status: true,
          publishStatus: true,
          categories: true,
          publishMonth: true,
        },
      })
    : [];

  // حالة البحوث حسب السنوات (حسب البيانات الفعلية)
  const researchYearMap: Record<
    number,
    { total: number; planned: number; completed: number; published: number }
  > = {};
  for (const r of allResearch) {
    const bucket = (researchYearMap[r.year] ??= {
      total: 0,
      planned: 0,
      completed: 0,
      published: 0,
    });
    bucket.total += 1;
    if (r.researchType === "PLANNED") bucket.planned += 1;
    if (r.status === "COMPLETED") bucket.completed += 1;
    if (r.publishStatus === "PUBLISHED") bucket.published += 1;
  }

  const yearlyData = Object.entries(researchYearMap)
    .map(([yearKey, v]) => ({
      name: yearKey,
      مخطط: v.planned,
      منجز: v.completed,
      منشور: v.published,
      "غير منجز": Math.max(0, v.total - v.completed),
    }))
    .sort((a, b) => Number(a.name) - Number(b.name));

  // توزيع الفهرسة
  let scopus = 0;
  let thomson = 0;
  let unindexed = 0;
  for (const r of allResearch) {
    if (r.categories.includes("SCOPUS")) scopus += 1;
    else if (r.categories.includes("ISI")) thomson += 1;
    else unindexed += 1;
  }
  const indexingData = [
    { name: "Scopus", value: scopus, color: "#2563EB" },
    { name: "Thomson Reuters", value: thomson, color: "#10b981" },
    { name: "غير مفهرس", value: unindexed, color: "#94a3b8" },
  ];

  // نشاطات حسب السنوات (مؤتمرات/ندوات/دورات/ورش)
  const activitiesYearMap: Record<
    number,
    { conferences: number; seminars: number; courses: number; workshops: number }
  > = {};

  const [
    conferences,
    seminars,
    courses,
    workshops,
    assignments,
    thankYouLetters,
    committees,
    certificates,
    journals,
    supervision,
    reviewing,
    positions,
    volunteering,
    fieldVisits,
  ] = await Promise.all([
    showActivities
      ? prisma.researcherConference.findMany({
          where: activityRange
            ? { researcherId: userId, date: { gte: activityRange.gte, lte: activityRange.lte } }
            : { researcherId: userId },
          select: { date: true },
        })
      : Promise.resolve([]),
    showActivities
      ? prisma.seminar.findMany({
          where: activityRange
            ? { researcherId: userId, date: { gte: activityRange.gte, lte: activityRange.lte } }
            : { researcherId: userId },
          select: { date: true },
        })
      : Promise.resolve([]),
    showActivities
      ? prisma.course.findMany({
          where: activityRange
            ? { researcherId: userId, date: { gte: activityRange.gte, lte: activityRange.lte } }
            : { researcherId: userId },
          select: { date: true },
        })
      : Promise.resolve([]),
    showActivities
      ? prisma.workshop.findMany({
          where: activityRange
            ? { researcherId: userId, date: { gte: activityRange.gte, lte: activityRange.lte } }
            : { researcherId: userId },
          select: { date: true },
        })
      : Promise.resolve([]),
    showActivities
      ? prisma.assignment.findMany({
          where: activityRange
            ? { researcherId: userId, assignmentDate: { gte: activityRange.gte, lte: activityRange.lte } }
            : { researcherId: userId },
          select: { assignmentDate: true },
        })
      : Promise.resolve([]),
    showActivities
      ? prisma.thankYouLetter.findMany({
          where: activityRange
            ? { researcherId: userId, date: { gte: activityRange.gte, lte: activityRange.lte } }
            : { researcherId: userId },
          select: { date: true },
        })
      : Promise.resolve([]),
    showActivities
      ? prisma.committee.findMany({
          where: activityRange
            ? { researcherId: userId, assignmentDate: { gte: activityRange.gte, lte: activityRange.lte } }
            : { researcherId: userId },
          select: { assignmentDate: true },
        })
      : Promise.resolve([]),
    showActivities
      ? prisma.certificate.findMany({
          where: activityRange
            ? { researcherId: userId, date: { gte: activityRange.gte, lte: activityRange.lte } }
            : { researcherId: userId },
          select: { date: true },
        })
      : Promise.resolve([]),
    showActivities
      ? prisma.journal.findMany({
          where: activityRange
            ? { researcherId: userId, startDate: { gte: activityRange.gte, lte: activityRange.lte } }
            : { researcherId: userId },
          select: { startDate: true },
        })
      : Promise.resolve([]),
    showActivities
      ? prisma.supervision.findMany({
          where: activityRange
            ? { researcherId: userId, startDate: { gte: activityRange.gte, lte: activityRange.lte } }
            : { researcherId: userId },
          select: { startDate: true },
        })
      : Promise.resolve([]),
    showActivities
      ? prisma.reviewing.findMany({
          where: activityRange
            ? { researcherId: userId, date: { gte: activityRange.gte, lte: activityRange.lte } }
            : { researcherId: userId },
          select: { date: true },
        })
      : Promise.resolve([]),
    showActivities
      ? prisma.position.findMany({
          where: activityRange
            ? { researcherId: userId, positionDate: { gte: activityRange.gte, lte: activityRange.lte } }
            : { researcherId: userId },
          select: { positionDate: true },
        })
      : Promise.resolve([]),
    showActivities
      ? prisma.volunteering.findMany({
          where: activityRange
            ? { researcherId: userId, startDate: { gte: activityRange.gte, lte: activityRange.lte } }
            : { researcherId: userId },
          select: { startDate: true },
        })
      : Promise.resolve([]),
    showActivities
      ? prisma.fieldVisit.findMany({
          where: activityRange
            ? { researcherId: userId, activityDate: { gte: activityRange.gte, lte: activityRange.lte } }
            : { researcherId: userId },
          select: { activityDate: true },
        })
      : Promise.resolve([]),
  ]);

  const pushYear = (y: number, key: "conferences" | "seminars" | "courses" | "workshops") => {
    if (!activitiesYearMap[y]) {
      activitiesYearMap[y] = { conferences: 0, seminars: 0, courses: 0, workshops: 0 };
    }
    activitiesYearMap[y][key] += 1;
  };

  conferences.forEach((c) => pushYear(new Date(c.date).getFullYear(), "conferences"));
  seminars.forEach((s) => pushYear(new Date(s.date).getFullYear(), "seminars"));
  courses.forEach((c) => pushYear(new Date(c.date).getFullYear(), "courses"));
  workshops.forEach((w) => pushYear(new Date(w.date).getFullYear(), "workshops"));

  const yearlyActivitiesData = Object.entries(activitiesYearMap)
    .map(([yearKey, v]) => ({
      name: yearKey,
      مؤتمرات: v.conferences,
      ندوات: v.seminars,
      دورات: v.courses,
      ورش: v.workshops,
    }))
    .sort((a, b) => Number(a.name) - Number(b.name));

  // توزيع النشاطات الأكاديمية (حسب الفترة إذا تم اختيارها)
  const sumOtherActivities =
    assignments.length +
    thankYouLetters.length +
    committees.length +
    certificates.length +
    journals.length +
    supervision.length +
    reviewing.length +
    positions.length +
    volunteering.length +
    fieldVisits.length;

  const activitiesDistributionData = [
    { name: "مؤتمرات", value: conferences.length, color: "#2563EB" },
    { name: "ندوات", value: seminars.length, color: "#10b981" },
    { name: "دورات", value: courses.length, color: "#f59e0b" },
    { name: "ورش عمل", value: workshops.length, color: "#ef4444" },
    { name: "أخرى", value: sumOtherActivities, color: "#8b5cf6" },
  ];

  // النشاط الشهري:
  // - مع سنة محددة: توزيع أشهر تلك السنة
  // - مع «الكل»: تجميع الأشهر عبر كل السنوات (وليس سنة التقويم الحالية فقط)
  const monthlyData = emptyMonthlyData();
  const incMonth = (m: number, delta: number) => {
    if (m >= 1 && m <= 12) monthlyData[m - 1].نشاطات += delta;
  };
  const matchesYear = (d: Date) => (year == null ? true : d.getFullYear() === year);
  const matchesMonth = (d: Date) => (month == null ? true : d.getMonth() + 1 === month);

  if (showResearch) {
    const researchForMonthly = await prisma.research.findMany({
      where: {
        researcherId: userId,
        ...(year != null ? { year } : {}),
        ...(month != null ? { publishMonth: month } : { publishMonth: { not: null } }),
      },
      select: { publishMonth: true },
    });
    researchForMonthly.forEach((r) => {
      if (r.publishMonth) incMonth(r.publishMonth, 1);
    });
  }

  if (showActivities) {
    const addFromDate = (d: Date) => {
      if (!matchesYear(d) || !matchesMonth(d)) return;
      incMonth(d.getMonth() + 1, 1);
    };
    conferences.forEach((c) => addFromDate(new Date(c.date)));
    seminars.forEach((s) => addFromDate(new Date(s.date)));
    courses.forEach((c) => addFromDate(new Date(c.date)));
    workshops.forEach((w) => addFromDate(new Date(w.date)));
    assignments.forEach((a) => addFromDate(new Date(a.assignmentDate)));
    thankYouLetters.forEach((t) => addFromDate(new Date(t.date)));
    committees.forEach((c) => addFromDate(new Date(c.assignmentDate)));
    certificates.forEach((c) => addFromDate(new Date(c.date)));
    journals.forEach((j) => addFromDate(new Date(j.startDate)));
    supervision.forEach((s) => addFromDate(new Date(s.startDate)));
    reviewing.forEach((r) => addFromDate(new Date(r.date)));
    positions.forEach((p) => addFromDate(new Date(p.positionDate)));
    volunteering.forEach((v) => addFromDate(new Date(v.startDate)));
    fieldVisits.forEach((f) => addFromDate(new Date(f.activityDate)));
  }

  return {
    indexingData: showResearch ? indexingData : [],
    yearlyData: showResearch ? yearlyData : [],
    monthlyData,
    activitiesDistributionData: showActivities ? activitiesDistributionData : [],
    yearlyActivitiesData: showActivities ? yearlyActivitiesData : [],
  };
}
