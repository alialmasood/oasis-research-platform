import { prisma } from "@/lib/db";

export type EvaluationPeriod = {
  year?: number;
  month?: number; // 1-12
};

export type EvaluationAggregates = {
  research: number;
  conferences: number;
  seminars: number;
  workshops: number;
  courses: number;
  assignments: number;
  thankYouLetters: number;
  committees: number;
  certificates: number;
  journals: number;
  supervision: number;
  reviewing: number;
  positions: number;
  volunteering: number;
  fieldVisits: number;
};

const defaultAggregates: EvaluationAggregates = {
  research: 0,
  conferences: 0,
  seminars: 0,
  workshops: 0,
  courses: 0,
  assignments: 0,
  thankYouLetters: 0,
  committees: 0,
  certificates: 0,
  journals: 0,
  supervision: 0,
  reviewing: 0,
  positions: 0,
  volunteering: 0,
  fieldVisits: 0,
};

function dateRange(period: EvaluationPeriod): { gte: Date; lte: Date } | null {
  if (period.year == null) return null;
  if (period.month != null) {
    const gte = new Date(period.year, period.month - 1, 1, 0, 0, 0, 0);
    const lte = new Date(period.year, period.month, 0, 23, 59, 59, 999);
    return { gte, lte };
  }
  const gte = new Date(period.year, 0, 1, 0, 0, 0, 0);
  const lte = new Date(period.year, 11, 31, 23, 59, 59, 999);
  return { gte, lte };
}

export async function getAggregatedCounts(
  userId: string,
  period?: EvaluationPeriod
): Promise<EvaluationAggregates> {
  const range = period ? dateRange(period) : null;
  const base = { researcherId: userId };
  const baseUser = { userId };

  const researchWhere =
    period?.year != null
      ? period.month != null
        ? { ...base, year: period.year, publishMonth: period.month }
        : { ...base, year: period.year }
      : base;

  const [
    researchCount,
    conferencesCount,
    seminarsCount,
    workshopsCount,
    coursesCount,
    assignmentsCount,
    thankYouLettersCount,
    committeesCount,
    certificatesCount,
    journalsCount,
    supervisionCount,
    reviewingCount,
    positionsCount,
    volunteeringCount,
    fieldVisitsCount,
  ] = await Promise.all([
    prisma.research.count({ where: researchWhere }),
    range
      ? prisma.researcherConference.count({
          where: { ...base, date: { gte: range.gte, lte: range.lte } },
        })
      : prisma.researcherConference.count({ where: base }),
    range
      ? prisma.seminar.count({
          where: { ...base, date: { gte: range.gte, lte: range.lte } },
        })
      : prisma.seminar.count({ where: base }),
    range
      ? prisma.workshop.count({
          where: { ...base, date: { gte: range.gte, lte: range.lte } },
        })
      : prisma.workshop.count({ where: base }),
    range
      ? prisma.course.count({
          where: { ...base, date: { gte: range.gte, lte: range.lte } },
        })
      : prisma.course.count({ where: base }),
    range
      ? prisma.assignment.count({
          where: { ...base, assignmentDate: { gte: range.gte, lte: range.lte } },
        })
      : prisma.assignment.count({ where: base }),
    range
      ? prisma.thankYouLetter.count({
          where: { ...base, date: { gte: range.gte, lte: range.lte } },
        })
      : prisma.thankYouLetter.count({ where: base }),
    range
      ? prisma.committee.count({
          where: { ...base, assignmentDate: { gte: range.gte, lte: range.lte } },
        })
      : prisma.committee.count({ where: base }),
    range
      ? prisma.certificate.count({
          where: { ...base, date: { gte: range.gte, lte: range.lte } },
        })
      : prisma.certificate.count({ where: base }),
    range
      ? prisma.journal.count({
          where: { ...base, startDate: { lte: range.lte } },
        })
      : prisma.journal.count({ where: base }),
    range
      ? prisma.supervision.count({
          where: { ...base, startDate: { lte: range.lte } },
        })
      : prisma.supervision.count({ where: base }),
    range
      ? prisma.reviewing.count({
          where: { ...base, date: { gte: range.gte, lte: range.lte } },
        })
      : prisma.reviewing.count({ where: base }),
    range
      ? prisma.position.count({
          where: { ...base, positionDate: { gte: range.gte, lte: range.lte } },
        })
      : prisma.position.count({ where: base }),
    range
      ? prisma.volunteering.count({
          where: { ...base, startDate: { lte: range.lte } },
        })
      : prisma.volunteering.count({ where: base }),
    range
      ? prisma.fieldVisit.count({
          where: { ...base, activityDate: { gte: range.gte, lte: range.lte } },
        })
      : prisma.fieldVisit.count({ where: base }),
  ]);

  return {
    ...defaultAggregates,
    research: researchCount,
    conferences: conferencesCount,
    seminars: seminarsCount,
    workshops: workshopsCount,
    courses: coursesCount,
    assignments: assignmentsCount,
    thankYouLetters: thankYouLettersCount,
    committees: committeesCount,
    certificates: certificatesCount,
    journals: journalsCount,
    supervision: supervisionCount,
    reviewing: reviewingCount,
    positions: positionsCount,
    volunteering: volunteeringCount,
    fieldVisits: fieldVisitsCount,
  };
}

/** السنوات التي توجد فيها بيانات (للقائمة المنسدلة) */
export async function getAvailableYears(userId: string): Promise<number[]> {
  const [researchYears, conferenceYears] = await Promise.all([
    prisma.research.findMany({
      where: { researcherId: userId },
      select: { year: true },
      distinct: ["year"],
    }),
    prisma.researcherConference.findMany({
      where: { researcherId: userId },
      select: { date: true },
    }),
  ]);
  const set = new Set<number>();
  researchYears.forEach((r) => set.add(r.year));
  conferenceYears.forEach((c) => set.add(new Date(c.date).getFullYear()));
  const seminars = await prisma.seminar.findMany({ where: { researcherId: userId }, select: { date: true } });
  seminars.forEach((s) => set.add(new Date(s.date).getFullYear()));
  const committees = await prisma.committee.findMany({ where: { researcherId: userId }, select: { assignmentDate: true } });
  committees.forEach((c) => set.add(new Date(c.assignmentDate).getFullYear()));
  return Array.from(set).sort((a, b) => b - a);
}
