import { prisma } from "@/lib/db";

type YearMonth = { year: number; month: number };

function toYearMonth(d: Date): YearMonth {
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export async function getAvailableYears(userId: string): Promise<number[]> {
  const [
    researchYears,
    conferences,
    seminars,
    workshops,
    courses,
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
    prisma.research.findMany({
      where: { researcherId: userId },
      select: { year: true },
      distinct: ["year"],
    }),
    prisma.researcherConference.findMany({ where: { researcherId: userId }, select: { date: true } }),
    prisma.seminar.findMany({ where: { researcherId: userId }, select: { date: true } }),
    prisma.workshop.findMany({ where: { researcherId: userId }, select: { date: true } }),
    prisma.course.findMany({ where: { researcherId: userId }, select: { date: true } }),
    prisma.assignment.findMany({ where: { researcherId: userId }, select: { assignmentDate: true } }),
    prisma.thankYouLetter.findMany({ where: { researcherId: userId }, select: { date: true } }),
    prisma.committee.findMany({ where: { researcherId: userId }, select: { assignmentDate: true } }),
    prisma.certificate.findMany({ where: { researcherId: userId }, select: { date: true } }),
    prisma.journal.findMany({ where: { researcherId: userId }, select: { startDate: true } }),
    prisma.supervision.findMany({ where: { researcherId: userId }, select: { startDate: true } }),
    prisma.reviewing.findMany({ where: { researcherId: userId }, select: { date: true } }),
    prisma.position.findMany({ where: { researcherId: userId }, select: { positionDate: true } }),
    prisma.volunteering.findMany({ where: { researcherId: userId }, select: { startDate: true } }),
    prisma.fieldVisit.findMany({ where: { researcherId: userId }, select: { activityDate: true } }),
  ]);

  const years = new Set<number>();
  researchYears.forEach((r) => years.add(r.year));
  conferences.forEach((r) => years.add(toYearMonth(r.date).year));
  seminars.forEach((r) => years.add(toYearMonth(r.date).year));
  workshops.forEach((r) => years.add(toYearMonth(r.date).year));
  courses.forEach((r) => years.add(toYearMonth(r.date).year));
  assignments.forEach((r) => years.add(toYearMonth(r.assignmentDate).year));
  thankYouLetters.forEach((r) => years.add(toYearMonth(r.date).year));
  committees.forEach((r) => years.add(toYearMonth(r.assignmentDate).year));
  certificates.forEach((r) => years.add(toYearMonth(r.date).year));
  journals.forEach((r) => years.add(toYearMonth(r.startDate).year));
  supervision.forEach((r) => years.add(toYearMonth(r.startDate).year));
  reviewing.forEach((r) => years.add(toYearMonth(r.date).year));
  positions.forEach((r) => years.add(toYearMonth(r.positionDate).year));
  volunteering.forEach((r) => years.add(toYearMonth(r.startDate).year));
  fieldVisits.forEach((r) => years.add(toYearMonth(r.activityDate).year));

  return Array.from(years).sort((a, b) => b - a);
}

export async function getAvailableMonthsForYear(userId: string, year: number): Promise<number[]> {
  const gte = new Date(year, 0, 1, 0, 0, 0, 0);
  const lte = new Date(year, 11, 31, 23, 59, 59, 999);

  const [
    researchMonths,
    conferences,
    seminars,
    workshops,
    courses,
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
    prisma.research.findMany({
      where: { researcherId: userId, year, publishMonth: { not: null } },
      select: { publishMonth: true },
    }),
    prisma.researcherConference.findMany({
      where: { researcherId: userId, date: { gte, lte } },
      select: { date: true },
    }),
    prisma.seminar.findMany({
      where: { researcherId: userId, date: { gte, lte } },
      select: { date: true },
    }),
    prisma.workshop.findMany({
      where: { researcherId: userId, date: { gte, lte } },
      select: { date: true },
    }),
    prisma.course.findMany({
      where: { researcherId: userId, date: { gte, lte } },
      select: { date: true },
    }),
    prisma.assignment.findMany({
      where: { researcherId: userId, assignmentDate: { gte, lte } },
      select: { assignmentDate: true },
    }),
    prisma.thankYouLetter.findMany({
      where: { researcherId: userId, date: { gte, lte } },
      select: { date: true },
    }),
    prisma.committee.findMany({
      where: { researcherId: userId, assignmentDate: { gte, lte } },
      select: { assignmentDate: true },
    }),
    prisma.certificate.findMany({
      where: { researcherId: userId, date: { gte, lte } },
      select: { date: true },
    }),
    prisma.journal.findMany({
      where: { researcherId: userId, startDate: { gte, lte } },
      select: { startDate: true },
    }),
    prisma.supervision.findMany({
      where: { researcherId: userId, startDate: { gte, lte } },
      select: { startDate: true },
    }),
    prisma.reviewing.findMany({
      where: { researcherId: userId, date: { gte, lte } },
      select: { date: true },
    }),
    prisma.position.findMany({
      where: { researcherId: userId, positionDate: { gte, lte } },
      select: { positionDate: true },
    }),
    prisma.volunteering.findMany({
      where: { researcherId: userId, startDate: { gte, lte } },
      select: { startDate: true },
    }),
    prisma.fieldVisit.findMany({
      where: { researcherId: userId, activityDate: { gte, lte } },
      select: { activityDate: true },
    }),
  ]);

  const months = new Set<number>();
  researchMonths.forEach((r) => {
    if (r.publishMonth != null) months.add(r.publishMonth);
  });
  conferences.forEach((r) => months.add(toYearMonth(r.date).month));
  seminars.forEach((r) => months.add(toYearMonth(r.date).month));
  workshops.forEach((r) => months.add(toYearMonth(r.date).month));
  courses.forEach((r) => months.add(toYearMonth(r.date).month));
  assignments.forEach((r) => months.add(toYearMonth(r.assignmentDate).month));
  thankYouLetters.forEach((r) => months.add(toYearMonth(r.date).month));
  committees.forEach((r) => months.add(toYearMonth(r.assignmentDate).month));
  certificates.forEach((r) => months.add(toYearMonth(r.date).month));
  journals.forEach((r) => months.add(toYearMonth(r.startDate).month));
  supervision.forEach((r) => months.add(toYearMonth(r.startDate).month));
  reviewing.forEach((r) => months.add(toYearMonth(r.date).month));
  positions.forEach((r) => months.add(toYearMonth(r.positionDate).month));
  volunteering.forEach((r) => months.add(toYearMonth(r.startDate).month));
  fieldVisits.forEach((r) => months.add(toYearMonth(r.activityDate).month));

  return Array.from(months).sort((a, b) => a - b);
}
