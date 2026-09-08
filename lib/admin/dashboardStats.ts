import { prisma } from "@/lib/db";
import { FACULTY_BASE_WHERE, getFacultyStats } from "@/lib/admin/facultyRepo";
import type { FacultyStats } from "@/lib/admin/facultyTypes";
import { getAdminResearchPageData } from "@/lib/admin/researchRepo";
import { parseResearchListFilters } from "@/lib/admin/researchListUrl";
import { getAdminResearcherGapMetrics } from "@/lib/admin/researchResearcherGaps";
import { getAdminResearchEvaluationPageData } from "@/lib/admin/researchEvaluation";
import { getAcademicYearBounds } from "@/lib/admin/researchPeriods";
import {
  getUniversityStructureCounts,
  type UniversityStructureCounts,
} from "@/lib/entities";
import type {
  AdminResearchPeriodCounts,
  AdminResearchStats,
  AdminResearcherGapMetric,
  AdminResearchEvaluationEntry,
} from "@/lib/admin/researchTypes";

export type AdminDashboardFacultySnapshot = FacultyStats & {
  activeFaculty: number;
  inactiveFaculty: number;
};

export type AdminDashboardOrgBucket = {
  name: string;
  total: number;
  active: number;
};

export type AdminDashboardEvaluationSummary = {
  evaluationYear: number;
  totalResearchers: number;
  averageScore: number;
  excellentCount: number;
  goodCount: number;
  needsImprovementCount: number;
  topEntries: AdminResearchEvaluationEntry[];
};

/** نشاطات الباحث المطلوبة في الإحصائيات (غير البحوث) */
export type AdminDashboardActivityStat = {
  key:
    | "conferences"
    | "seminars"
    | "courses"
    | "workshops"
    | "assignments"
    | "committees";
  label: string;
  total: number;
  academicYear: number;
};

export type AdminDashboardActivitiesSummary = {
  items: AdminDashboardActivityStat[];
  totalAll: number;
  academicYearAll: number;
};

export type AdminDashboardCoverageSummary = {
  goalsYear: number;
  form21YearLabel: string;
  activeFaculty: number;
  withGoals: number;
  withoutGoals: number;
  withForm21: number;
  withoutForm21: number;
};

export type AdminDashboardStats = {
  academicYearLabel: string;
  faculty: AdminDashboardFacultySnapshot;
  structure: UniversityStructureCounts;
  research: AdminResearchStats;
  periodCounts: AdminResearchPeriodCounts;
  gaps: AdminResearcherGapMetric[];
  orgByEntity: AdminDashboardOrgBucket[];
  orgByDepartment: AdminDashboardOrgBucket[];
  evaluation: AdminDashboardEvaluationSummary;
  activities: AdminDashboardActivitiesSummary;
  coverage: AdminDashboardCoverageSummary;
};

function buildOrgBuckets(
  rows: Array<{ label: string | null; isActive: boolean }>,
  limit = 8
): AdminDashboardOrgBucket[] {
  const map = new Map<string, { total: number; active: number }>();

  for (const row of rows) {
    const name = row.label?.trim();
    if (!name) continue;
    const current = map.get(name) ?? { total: 0, active: 0 };
    current.total += 1;
    if (row.isActive) current.active += 1;
    map.set(name, current);
  }

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, total: value.total, active: value.active }))
    .sort(
      (a, b) =>
        b.total - a.total || a.name.localeCompare(b.name, "ar")
    )
    .slice(0, limit);
}

function form21YearCandidates(academic: {
  startYear: number;
  endYear: number;
  label: string;
}): string[] {
  const calYear = new Date().getFullYear();
  return Array.from(
    new Set([
      academic.label,
      `${academic.startYear} - ${academic.endYear}`,
      `${academic.startYear} – ${academic.endYear}`,
      `${calYear} - ${calYear + 1}`,
      `${calYear} – ${calYear + 1}`,
    ])
  );
}

async function countFacultyActivity(
  countTotal: () => Promise<number>,
  countAcademic: () => Promise<number>
): Promise<{ total: number; academicYear: number }> {
  const [total, academicYear] = await Promise.all([countTotal(), countAcademic()]);
  return { total, academicYear };
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const academic = getAcademicYearBounds();
  const evaluationYear = academic.startYear;
  const form21Years = form21YearCandidates(academic);
  const facultyRel = { researcher: FACULTY_BASE_WHERE };
  const academicDate = { gte: academic.start, lte: academic.end };

  const [
    facultyStats,
    activeFaculty,
    inactiveFaculty,
    researchPage,
    gaps,
    facultyOrgRows,
    evaluationPage,
    conferenceCounts,
    seminarCounts,
    courseCounts,
    workshopCounts,
    assignmentCounts,
    committeeCounts,
    goalsRows,
    form21Rows,
  ] = await Promise.all([
    getFacultyStats(),
    prisma.user.count({ where: { ...FACULTY_BASE_WHERE, isActive: true } }),
    prisma.user.count({ where: { ...FACULTY_BASE_WHERE, isActive: false } }),
    getAdminResearchPageData(parseResearchListFilters({})),
    getAdminResearcherGapMetrics(),
    prisma.user.findMany({
      where: FACULTY_BASE_WHERE,
      select: { entity: true, department: true, isActive: true },
    }),
    getAdminResearchEvaluationPageData(),
    countFacultyActivity(
      () => prisma.researcherConference.count({ where: facultyRel }),
      () =>
        prisma.researcherConference.count({
          where: { ...facultyRel, date: academicDate },
        })
    ),
    countFacultyActivity(
      () => prisma.seminar.count({ where: facultyRel }),
      () => prisma.seminar.count({ where: { ...facultyRel, date: academicDate } })
    ),
    countFacultyActivity(
      () => prisma.course.count({ where: facultyRel }),
      () => prisma.course.count({ where: { ...facultyRel, date: academicDate } })
    ),
    countFacultyActivity(
      () => prisma.workshop.count({ where: facultyRel }),
      () => prisma.workshop.count({ where: { ...facultyRel, date: academicDate } })
    ),
    countFacultyActivity(
      () => prisma.assignment.count({ where: facultyRel }),
      () =>
        prisma.assignment.count({
          where: { ...facultyRel, assignmentDate: academicDate },
        })
    ),
    countFacultyActivity(
      () => prisma.committee.count({ where: facultyRel }),
      () =>
        prisma.committee.count({
          where: { ...facultyRel, assignmentDate: academicDate },
        })
    ),
    prisma.researcherGoals.findMany({
      where: {
        year: evaluationYear,
        user: { ...FACULTY_BASE_WHERE, isActive: true },
      },
      select: { userId: true },
    }),
    prisma.form21Submission.findMany({
      where: {
        year: { in: form21Years },
        researcher: { ...FACULTY_BASE_WHERE, isActive: true },
      },
      select: { researcherId: true },
      distinct: ["researcherId"],
    }),
  ]);

  const activityItems: AdminDashboardActivityStat[] = [
    {
      key: "conferences",
      label: "المؤتمرات",
      total: conferenceCounts.total,
      academicYear: conferenceCounts.academicYear,
    },
    {
      key: "seminars",
      label: "الندوات",
      total: seminarCounts.total,
      academicYear: seminarCounts.academicYear,
    },
    {
      key: "courses",
      label: "الدورات",
      total: courseCounts.total,
      academicYear: courseCounts.academicYear,
    },
    {
      key: "workshops",
      label: "ورش العمل",
      total: workshopCounts.total,
      academicYear: workshopCounts.academicYear,
    },
    {
      key: "assignments",
      label: "التكليفات",
      total: assignmentCounts.total,
      academicYear: assignmentCounts.academicYear,
    },
    {
      key: "committees",
      label: "اللجان",
      total: committeeCounts.total,
      academicYear: committeeCounts.academicYear,
    },
  ];

  const withGoals = new Set(goalsRows.map((row) => row.userId)).size;
  const withForm21 = new Set(form21Rows.map((row) => row.researcherId)).size;

  return {
    academicYearLabel: academic.label,
    faculty: {
      ...facultyStats,
      activeFaculty,
      inactiveFaculty,
    },
    structure: getUniversityStructureCounts(),
    research: researchPage.stats,
    periodCounts: researchPage.periodCounts,
    gaps,
    orgByEntity: buildOrgBuckets(
      facultyOrgRows.map((row) => ({ label: row.entity, isActive: row.isActive }))
    ),
    orgByDepartment: buildOrgBuckets(
      facultyOrgRows.map((row) => ({
        label: row.department,
        isActive: row.isActive,
      }))
    ),
    evaluation: {
      evaluationYear: evaluationPage.evaluationYear,
      totalResearchers: evaluationPage.totalResearchers,
      averageScore: evaluationPage.averageScore,
      excellentCount: evaluationPage.excellentCount,
      goodCount: evaluationPage.goodCount,
      needsImprovementCount: evaluationPage.needsImprovementCount,
      topEntries: evaluationPage.entries.slice(0, 5),
    },
    activities: {
      items: activityItems,
      totalAll: activityItems.reduce((sum, item) => sum + item.total, 0),
      academicYearAll: activityItems.reduce(
        (sum, item) => sum + item.academicYear,
        0
      ),
    },
    coverage: {
      goalsYear: evaluationYear,
      form21YearLabel: `${academic.startYear} - ${academic.endYear}`,
      activeFaculty,
      withGoals,
      withoutGoals: Math.max(0, activeFaculty - withGoals),
      withForm21,
      withoutForm21: Math.max(0, activeFaculty - withForm21),
    },
  };
}
