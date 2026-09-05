import { prisma } from "@/lib/db";
import { FACULTY_BASE_WHERE } from "@/lib/admin/facultyRepo";
import { getAcademicYearBounds } from "@/lib/admin/researchPeriods";
import { computeOverallScore } from "@/app/researcher/evaluation/types";
import type { EvaluationAggregates } from "@/lib/evaluationAggregate";
import type {
  AdminResearchEvaluationEntry,
  AdminResearchEvaluationPageData,
} from "@/lib/admin/researchTypes";

function mapGroupCounts(rows: Array<{ researcherId: string; _count: { _all: number } }>) {
  return Object.fromEntries(rows.map((row) => [row.researcherId, row._count._all]));
}

function getDisplayName(fullNameAr: string | null, fullNameEn: string | null): string {
  return fullNameAr?.trim() || fullNameEn?.trim() || "—";
}

function sumActivities(aggregates: EvaluationAggregates): number {
  const { research: _research, ...rest } = aggregates;
  return Object.values(rest).reduce((sum, value) => sum + value, 0);
}

export async function getAdminResearchEvaluationPageData(): Promise<AdminResearchEvaluationPageData> {
  const academic = getAcademicYearBounds();
  const evaluationYear = academic.startYear;
  const yearRange = {
    gte: new Date(evaluationYear, 0, 1, 0, 0, 0, 0),
    lte: new Date(evaluationYear, 11, 31, 23, 59, 59, 999),
  };

  const faculty = await prisma.user.findMany({
    where: { ...FACULTY_BASE_WHERE, isActive: true },
    select: {
      id: true,
      fullNameAr: true,
      fullNameEn: true,
      entity: true,
      department: true,
      academicTitle: true,
    },
    orderBy: [{ fullNameAr: "asc" }, { fullNameEn: "asc" }],
  });

  const facultyIds = faculty.map((member) => member.id);
  const inFaculty = { researcherId: { in: facultyIds } };

  const [
    researchCounts,
    conferenceCounts,
    seminarCounts,
    workshopCounts,
    courseCounts,
    assignmentCounts,
    thankYouCounts,
    committeeCounts,
    certificateCounts,
    journalCounts,
    supervisionCounts,
    reviewingCounts,
    positionCounts,
    volunteeringCounts,
    fieldVisitCounts,
  ] = await Promise.all([
    prisma.research.groupBy({
      by: ["researcherId"],
      _count: { _all: true },
      where: { ...inFaculty, year: evaluationYear },
    }),
    prisma.researcherConference.groupBy({
      by: ["researcherId"],
      _count: { _all: true },
      where: { ...inFaculty, date: yearRange },
    }),
    prisma.seminar.groupBy({
      by: ["researcherId"],
      _count: { _all: true },
      where: { ...inFaculty, date: yearRange },
    }),
    prisma.workshop.groupBy({
      by: ["researcherId"],
      _count: { _all: true },
      where: { ...inFaculty, date: yearRange },
    }),
    prisma.course.groupBy({
      by: ["researcherId"],
      _count: { _all: true },
      where: { ...inFaculty, date: yearRange },
    }),
    prisma.assignment.groupBy({
      by: ["researcherId"],
      _count: { _all: true },
      where: { ...inFaculty, assignmentDate: yearRange },
    }),
    prisma.thankYouLetter.groupBy({
      by: ["researcherId"],
      _count: { _all: true },
      where: { ...inFaculty, date: yearRange },
    }),
    prisma.committee.groupBy({
      by: ["researcherId"],
      _count: { _all: true },
      where: { ...inFaculty, assignmentDate: yearRange },
    }),
    prisma.certificate.groupBy({
      by: ["researcherId"],
      _count: { _all: true },
      where: { ...inFaculty, date: yearRange },
    }),
    prisma.journal.groupBy({
      by: ["researcherId"],
      _count: { _all: true },
      where: { ...inFaculty, startDate: { lte: yearRange.lte } },
    }),
    prisma.supervision.groupBy({
      by: ["researcherId"],
      _count: { _all: true },
      where: { ...inFaculty, startDate: { lte: yearRange.lte } },
    }),
    prisma.reviewing.groupBy({
      by: ["researcherId"],
      _count: { _all: true },
      where: { ...inFaculty, date: yearRange },
    }),
    prisma.position.groupBy({
      by: ["researcherId"],
      _count: { _all: true },
      where: { ...inFaculty, positionDate: yearRange },
    }),
    prisma.volunteering.groupBy({
      by: ["researcherId"],
      _count: { _all: true },
      where: { ...inFaculty, startDate: { lte: yearRange.lte } },
    }),
    prisma.fieldVisit.groupBy({
      by: ["researcherId"],
      _count: { _all: true },
      where: { ...inFaculty, activityDate: yearRange },
    }),
  ]);

  const counts = {
    research: mapGroupCounts(researchCounts),
    conferences: mapGroupCounts(conferenceCounts),
    seminars: mapGroupCounts(seminarCounts),
    workshops: mapGroupCounts(workshopCounts),
    courses: mapGroupCounts(courseCounts),
    assignments: mapGroupCounts(assignmentCounts),
    thankYouLetters: mapGroupCounts(thankYouCounts),
    committees: mapGroupCounts(committeeCounts),
    certificates: mapGroupCounts(certificateCounts),
    journals: mapGroupCounts(journalCounts),
    supervision: mapGroupCounts(supervisionCounts),
    reviewing: mapGroupCounts(reviewingCounts),
    positions: mapGroupCounts(positionCounts),
    volunteering: mapGroupCounts(volunteeringCounts),
    fieldVisits: mapGroupCounts(fieldVisitCounts),
  };

  const entries: AdminResearchEvaluationEntry[] = faculty.map((member) => {
    const aggregates: EvaluationAggregates = {
      research: counts.research[member.id] ?? 0,
      conferences: counts.conferences[member.id] ?? 0,
      seminars: counts.seminars[member.id] ?? 0,
      workshops: counts.workshops[member.id] ?? 0,
      courses: counts.courses[member.id] ?? 0,
      assignments: counts.assignments[member.id] ?? 0,
      thankYouLetters: counts.thankYouLetters[member.id] ?? 0,
      committees: counts.committees[member.id] ?? 0,
      certificates: counts.certificates[member.id] ?? 0,
      journals: counts.journals[member.id] ?? 0,
      supervision: counts.supervision[member.id] ?? 0,
      reviewing: counts.reviewing[member.id] ?? 0,
      positions: counts.positions[member.id] ?? 0,
      volunteering: counts.volunteering[member.id] ?? 0,
      fieldVisits: counts.fieldVisits[member.id] ?? 0,
    };

    return {
      id: member.id,
      displayName: getDisplayName(member.fullNameAr, member.fullNameEn),
      entity: member.entity,
      department: member.department,
      academicTitle: member.academicTitle,
      score: computeOverallScore(aggregates),
      researchCount: aggregates.research,
      activitiesTotal: sumActivities(aggregates),
    };
  });

  entries.sort((a, b) => b.score - a.score || a.displayName.localeCompare(b.displayName, "ar"));

  const totalResearchers = entries.length;
  const averageScore =
    totalResearchers > 0
      ? Math.round(entries.reduce((sum, entry) => sum + entry.score, 0) / totalResearchers)
      : 0;
  const excellentCount = entries.filter((entry) => entry.score >= 90).length;
  const goodCount = entries.filter((entry) => entry.score >= 70 && entry.score < 90).length;
  const needsImprovementCount = entries.filter((entry) => entry.score < 70).length;

  const entities = Array.from(
    new Set(entries.map((entry) => entry.entity).filter((entity): entity is string => !!entity))
  ).sort((a, b) => a.localeCompare(b, "ar"));

  return {
    academicYearLabel: academic.label,
    evaluationYear,
    totalResearchers,
    averageScore,
    excellentCount,
    goodCount,
    needsImprovementCount,
    entries,
    entities,
  };
}
