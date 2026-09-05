import { prisma } from "@/lib/db";
import { FACULTY_BASE_WHERE } from "@/lib/admin/facultyRepo";
import { DEGREE_LABELS, type FacultyDegreeType } from "@/lib/admin/facultyTypes";
import { getAcademicYearBounds, researchMatchesPeriod } from "./researchPeriods";
import type {
  AdminResearcherGapMember,
  AdminResearcherGapMetric,
  AdminResearcherGapTable,
  AdminResearcherIndicatorsPageData,
  AdminResearcherOrgInsight,
} from "./researchTypes";

const DEGREE_RANK: Record<FacultyDegreeType, number> = {
  BACHELORS: 1,
  DIPLOMA: 2,
  HIGHER_DIPLOMA: 3,
  MASTERS: 4,
  PHD: 5,
  BOARD: 6,
};

type ResearchRow = {
  researcherId: string;
  publishStatus: string | null;
  categories: string[];
  year: number;
  publishMonth: number | null;
  createdAt: Date;
};

type ResearcherRow = {
  id: string;
  fullNameAr: string | null;
  fullNameEn: string | null;
  entity: string | null;
  department: string | null;
  academicTitle: string | null;
  academicDegrees: { degree: FacultyDegreeType }[];
};

const GAP_DEFINITIONS: Array<{
  id: AdminResearcherGapMetric["id"];
  label: string;
  tableTitle: string;
  getDescription: (academicLabel: string) => string;
  test: (items: ResearchRow[]) => boolean;
}> = [
  {
    id: "no_research",
    label: "بلا أي بحث",
    tableTitle: "تدريسيون بلا أي بحث مسجّل",
    getDescription: () => "لم يُدخلوا أي بحث في المنصة",
    test: (items) => items.length === 0,
  },
  {
    id: "no_scopus",
    label: "بلا بحث سكوبس",
    tableTitle: "تدريسيون بلا بحث SCOPUS",
    getDescription: () => "بدون أي بحث مصنّف SCOPUS",
    test: (items) => !items.some((r) => r.categories.includes("SCOPUS")),
  },
  {
    id: "no_academic_activity",
    label: "بلا نشاط — العام الدراسي",
    tableTitle: "تدريسيون بلا نشاط بحثي — العام الدراسي الحالي",
    getDescription: (academicLabel) => `بدون إدخال أو نشر بحث في ${academicLabel}`,
    test: (items) => !items.some((r) => researchMatchesPeriod(r, "academic")),
  },
];

function getDisplayName(fullNameAr: string | null, fullNameEn: string | null): string {
  return fullNameAr?.trim() || fullNameEn?.trim() || "—";
}

function getHighestDegreeLabel(degrees: { degree: FacultyDegreeType }[]): string | null {
  if (degrees.length === 0) return null;
  const highest = degrees.reduce((best, current) =>
    DEGREE_RANK[current.degree] > DEGREE_RANK[best.degree] ? current : best
  );
  return DEGREE_LABELS[highest.degree] ?? highest.degree;
}

function mapResearcherToMember(researcher: ResearcherRow): AdminResearcherGapMember {
  return {
    id: researcher.id,
    displayName: getDisplayName(researcher.fullNameAr, researcher.fullNameEn),
    entity: researcher.entity,
    academicTitle: researcher.academicTitle,
    highestDegree: getHighestDegreeLabel(researcher.academicDegrees),
  };
}

function sortMembers(members: AdminResearcherGapMember[]): AdminResearcherGapMember[] {
  return [...members].sort((a, b) => {
    const entityA = a.entity ?? "zzz";
    const entityB = b.entity ?? "zzz";
    const byEntity = entityA.localeCompare(entityB, "ar");
    if (byEntity !== 0) return byEntity;
    return a.displayName.localeCompare(b.displayName, "ar");
  });
}

type GroupKey = "entity" | "department";

function getGroupLabel(researcher: ResearcherRow, key: GroupKey): string | null {
  const value = key === "entity" ? researcher.entity : researcher.department;
  const trimmed = value?.trim();
  return trimmed || null;
}

function groupResearchersBy(
  researchers: ResearcherRow[],
  key: GroupKey
): Map<string, ResearcherRow[]> {
  const groups = new Map<string, ResearcherRow[]>();

  for (const researcher of researchers) {
    const label = getGroupLabel(researcher, key);
    if (!label) continue;

    const list = groups.get(label) ?? [];
    list.push(researcher);
    groups.set(label, list);
  }

  return groups;
}

function hasResearch(items: ResearchRow[]): boolean {
  return items.length > 0;
}

function hasScopusResearch(items: ResearchRow[]): boolean {
  return items.some((r) => r.categories.includes("SCOPUS"));
}

function hasAcademicYearActivity(items: ResearchRow[]): boolean {
  return items.some((r) => researchMatchesPeriod(r, "academic"));
}

function pickGroupWithMaxCount(
  groups: Map<string, ResearcherRow[]>,
  byResearcher: Map<string, ResearchRow[]>,
  score: (items: ResearchRow[]) => number
): { groupName: string; count: number; totalInGroup: number } | null {
  let best: { groupName: string; count: number; totalInGroup: number } | null = null;

  for (const [groupName, members] of groups) {
    const count = members.reduce((sum, member) => sum + score(byResearcher.get(member.id) ?? []), 0);
    if (
      !best ||
      count > best.count ||
      (count === best.count && groupName.localeCompare(best.groupName, "ar") < 0)
    ) {
      best = { groupName, count, totalInGroup: members.length };
    }
  }

  return best;
}

function pickGroupWithMinCount(
  groups: Map<string, ResearcherRow[]>,
  byResearcher: Map<string, ResearchRow[]>,
  score: (items: ResearchRow[]) => number
): { groupName: string; count: number; totalInGroup: number } | null {
  let best: { groupName: string; count: number; totalInGroup: number } | null = null;

  for (const [groupName, members] of groups) {
    const count = members.reduce((sum, member) => sum + score(byResearcher.get(member.id) ?? []), 0);
    if (
      !best ||
      count < best.count ||
      (count === best.count &&
        (members.length > best.totalInGroup ||
          (members.length === best.totalInGroup &&
            groupName.localeCompare(best.groupName, "ar") < 0)))
    ) {
      best = { groupName, count, totalInGroup: members.length };
    }
  }

  return best;
}

function buildOrgInsight(
  id: AdminResearcherOrgInsight["id"],
  title: string,
  description: string,
  result: { groupName: string; count: number; totalInGroup: number } | null
): AdminResearcherOrgInsight {
  return {
    id,
    title,
    description,
    groupName: result?.groupName ?? "—",
    count: result?.count ?? 0,
    totalInGroup: result?.totalInGroup ?? 0,
  };
}

function computeOrgInsights(
  researchers: ResearcherRow[],
  byResearcher: Map<string, ResearchRow[]>,
  academicLabel: string
): AdminResearcherOrgInsight[] {
  const entityGroups = groupResearchersBy(researchers, "entity");
  const departmentGroups = groupResearchersBy(researchers, "department");

  const noResearchScore = (items: ResearchRow[]) => (hasResearch(items) ? 0 : 1);
  const scopusPublisherScore = (items: ResearchRow[]) => (hasScopusResearch(items) ? 1 : 0);
  const academicActivityScore = (items: ResearchRow[]) => (hasAcademicYearActivity(items) ? 1 : 0);

  return [
    buildOrgInsight(
      "entity_most_no_research",
      "أكثر تشكيل — بلا بحوث",
      "التشكيل الذي لديه أكثر تدريسيين بلا أي بحث مسجّل",
      pickGroupWithMaxCount(entityGroups, byResearcher, noResearchScore)
    ),
    buildOrgInsight(
      "department_most_no_research",
      "أكثر قسم — بلا بحوث",
      "القسم الذي لديه أكثر تدريسيين بلا أي بحث مسجّل",
      pickGroupWithMaxCount(departmentGroups, byResearcher, noResearchScore)
    ),
    buildOrgInsight(
      "entity_fewest_scopus_publishers",
      "أقل تشكيل — نشر SCOPUS",
      "التشكيل الذي لديه أقل عدد من التدريسيين ينشرون بحوث SCOPUS",
      pickGroupWithMinCount(entityGroups, byResearcher, scopusPublisherScore)
    ),
    buildOrgInsight(
      "department_fewest_scopus_publishers",
      "أقل قسم — نشر SCOPUS",
      "القسم الذي لديه أقل عدد من التدريسيين ينشرون بحوث SCOPUS",
      pickGroupWithMinCount(departmentGroups, byResearcher, scopusPublisherScore)
    ),
    buildOrgInsight(
      "entity_least_academic_activity",
      "أقل تشكيل — نشاط العام",
      `التشكيل الذي لديه أقل نشاط بحثي خلال ${academicLabel}`,
      pickGroupWithMinCount(entityGroups, byResearcher, academicActivityScore)
    ),
    buildOrgInsight(
      "department_least_academic_activity",
      "أقل قسم — نشاط العام",
      `القسم الذي لديه أقل نشاط بحثي خلال ${academicLabel}`,
      pickGroupWithMinCount(departmentGroups, byResearcher, academicActivityScore)
    ),
  ];
}

export async function getAdminResearcherIndicatorsPageData(): Promise<AdminResearcherIndicatorsPageData> {
  const academic = getAcademicYearBounds();

  const [researchers, research] = await Promise.all([
    prisma.user.findMany({
      where: { ...FACULTY_BASE_WHERE, isActive: true },
      select: {
        id: true,
        fullNameAr: true,
        fullNameEn: true,
        entity: true,
        department: true,
        academicTitle: true,
        academicDegrees: { select: { degree: true } },
      },
    }),
    prisma.research.findMany({
      where: { researcher: { ...FACULTY_BASE_WHERE, isActive: true } },
      select: {
        researcherId: true,
        publishStatus: true,
        categories: true,
        year: true,
        publishMonth: true,
        createdAt: true,
      },
    }),
  ]);

  const totalResearchers = researchers.length;
  const byResearcher = new Map<string, ResearchRow[]>();

  for (const row of research) {
    const list = byResearcher.get(row.researcherId) ?? [];
    list.push(row);
    byResearcher.set(row.researcherId, list);
  }

  const metrics: AdminResearcherGapMetric[] = [];
  const tables: AdminResearcherGapTable[] = [];

  for (const def of GAP_DEFINITIONS) {
    const members: AdminResearcherGapMember[] = [];

    for (const researcher of researchers) {
      const items = byResearcher.get(researcher.id) ?? [];
      if (def.test(items)) {
        members.push(mapResearcherToMember(researcher));
      }
    }

    const sorted = sortMembers(members);
    const description = def.getDescription(academic.label);

    metrics.push({
      id: def.id,
      label: def.label,
      description,
      count: sorted.length,
      totalResearchers,
    });

    tables.push({
      id: def.id,
      title: def.tableTitle,
      description,
      count: sorted.length,
      members: sorted,
    });
  }

  const orgInsights = computeOrgInsights(researchers, byResearcher, academic.label);

  return {
    totalResearchers,
    metrics,
    tables,
    academicYearLabel: academic.label,
    orgInsights,
  };
}

/** @deprecated استخدم getAdminResearcherIndicatorsPageData */
export async function getAdminResearcherGapMetrics(): Promise<AdminResearcherGapMetric[]> {
  const data = await getAdminResearcherIndicatorsPageData();
  return data.metrics;
}
