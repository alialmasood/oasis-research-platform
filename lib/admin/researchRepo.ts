import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  getPeriodOptions,
  researchMatchesPeriod,
} from "./researchPeriods";
import {
  CATEGORY_LABELS,
  OWNERSHIP_LABELS,
  PUBLISH_STATUS_LABELS,
  PUBLISH_TYPE_LABELS,
  RESEARCH_PAGE_SIZE,
  RESEARCH_STATUS_LABELS,
  RESEARCH_TYPE_LABELS,
  type AdminResearchItem,
  type AdminResearchListFilters,
  type AdminResearchPageData,
  type AdminResearchPeriodCounts,
} from "./researchTypes";
import {
  computeUniversityResearchStats,
  type UniversityResearchStatsRow,
} from "./universityResearchStats";

const MONTH_NAMES = [
  "",
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

const RESEARCH_SELECT = {
  id: true,
  title: true,
  researchType: true,
  ownership: true,
  status: true,
  progressPercent: true,
  year: true,
  publishStatus: true,
  publishType: true,
  publishMonth: true,
  publisher: true,
  doi: true,
  categories: true,
  scopusQuartile: true,
  researchUrl: true,
  downloadUrl: true,
  createdAt: true,
  updatedAt: true,
  researcher: {
    select: {
      id: true,
      fullNameAr: true,
      fullNameEn: true,
      email: true,
      entity: true,
      department: true,
      academicTitle: true,
    },
  },
} as const;

const STATS_SELECT = {
  id: true,
  status: true,
  publishStatus: true,
  publishType: true,
  researchType: true,
  ownership: true,
  categories: true,
  progressPercent: true,
  year: true,
  publishMonth: true,
  scopusQuartile: true,
  createdAt: true,
  researcherId: true,
} as const;

type ResearchRow = Prisma.ResearchGetPayload<{ select: typeof RESEARCH_SELECT }>;

function getDisplayName(fullNameAr: string | null, fullNameEn: string | null): string {
  return fullNameAr?.trim() || fullNameEn?.trim() || "—";
}

function mapResearchRow(row: ResearchRow): AdminResearchItem {
  return {
    id: row.id,
    title: row.title,
    researchType: row.researchType,
    researchTypeLabel: RESEARCH_TYPE_LABELS[row.researchType] ?? row.researchType,
    ownership: row.ownership,
    ownershipLabel: OWNERSHIP_LABELS[row.ownership] ?? row.ownership,
    status: row.status,
    statusLabel: RESEARCH_STATUS_LABELS[row.status] ?? row.status,
    progressPercent: row.progressPercent,
    year: row.year,
    publishStatus: row.publishStatus,
    publishStatusLabel: row.publishStatus
      ? (PUBLISH_STATUS_LABELS[row.publishStatus] ?? row.publishStatus)
      : null,
    publishType: row.publishType,
    publishTypeLabel: row.publishType
      ? (PUBLISH_TYPE_LABELS[row.publishType] ?? row.publishType)
      : null,
    publishMonth: row.publishMonth,
    publishMonthLabel: row.publishMonth ? MONTH_NAMES[row.publishMonth] : null,
    publisher: row.publisher,
    doi: row.doi,
    categories: row.categories,
    categoriesLabel:
      row.categories.length > 0
        ? row.categories.map((c) => CATEGORY_LABELS[c] ?? c).join(" · ")
        : "—",
    scopusQuartile: row.scopusQuartile,
    researchUrl: row.researchUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    researcher: {
      id: row.researcher.id,
      displayName: getDisplayName(row.researcher.fullNameAr, row.researcher.fullNameEn),
      email: row.researcher.email,
      entity: row.researcher.entity,
      department: row.researcher.department,
      academicTitle: row.researcher.academicTitle,
    },
  };
}

function computePeriodCounts(rows: UniversityResearchStatsRow[]): AdminResearchPeriodCounts {
  return {
    month: rows.filter((r) => researchMatchesPeriod(r, "month")).length,
    year: rows.filter((r) => researchMatchesPeriod(r, "year")).length,
    academic: rows.filter((r) => researchMatchesPeriod(r, "academic")).length,
    semester: rows.filter((r) => researchMatchesPeriod(r, "semester")).length,
  };
}

export function buildPrismaWhere(filters: AdminResearchListFilters): Prisma.ResearchWhereInput {
  const conditions: Prisma.ResearchWhereInput[] = [{ researcher: { role: "RESEARCHER" } }];

  const q = filters.search.trim();
  if (q) {
    conditions.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { publisher: { contains: q, mode: "insensitive" } },
        { doi: { contains: q, mode: "insensitive" } },
        { researcher: { fullNameAr: { contains: q, mode: "insensitive" } } },
        { researcher: { fullNameEn: { contains: q, mode: "insensitive" } } },
        { researcher: { email: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  if (filters.status) conditions.push({ status: filters.status as "IN_PROGRESS" | "COMPLETED" });
  if (filters.publishStatus) {
    if (filters.publishStatus === "DRAFT") {
      conditions.push({ OR: [{ publishStatus: "DRAFT" }, { publishStatus: null }] });
    } else {
      conditions.push({ publishStatus: filters.publishStatus as "PUBLISHED" });
    }
  }
  if (filters.researchType) {
    conditions.push({ researchType: filters.researchType as "PLANNED" | "UNPLANNED" });
  }
  if (filters.year) conditions.push({ year: parseInt(filters.year, 10) });
  if (filters.entity) conditions.push({ researcher: { entity: filters.entity } });
  if (filters.category) conditions.push({ categories: { has: filters.category } });
  if (filters.publishType) {
    conditions.push({
      publishType: filters.publishType as "JOURNAL" | "CONFERENCE" | "BOOK_CHAPTER" | "REPORT" | "OTHER",
    });
  }
  if (filters.scopusQuartile) {
    conditions.push({ scopusQuartile: filters.scopusQuartile as "Q1" | "Q2" | "Q3" | "Q4" });
  }

  return conditions.length === 1 ? conditions[0] : { AND: conditions };
}

function buildListWhere(
  filters: AdminResearchListFilters,
  baseRows: UniversityResearchStatsRow[]
): Prisma.ResearchWhereInput {
  const prismaWhere = buildPrismaWhere(filters);

  if (filters.period === "all") return prismaWhere;

  const periodIds = baseRows
    .filter((r) => researchMatchesPeriod(r, filters.period))
    .map((r) => r.id);

  return {
    AND: [prismaWhere, { id: { in: periodIds } }],
  };
}

async function getFilterOptions() {
  const [entitiesRows, yearsRows] = await Promise.all([
    prisma.user.findMany({
      where: { role: "RESEARCHER", entity: { not: null } },
      select: { entity: true },
      distinct: ["entity"],
      orderBy: { entity: "asc" },
    }),
    prisma.research.findMany({
      where: { researcher: { role: "RESEARCHER" } },
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    }),
  ]);

  return {
    entities: entitiesRows.map((r) => r.entity as string),
    years: yearsRows.map((r) => r.year),
  };
}

async function fetchStatsRows(
  where: Prisma.ResearchWhereInput
): Promise<UniversityResearchStatsRow[]> {
  return prisma.research.findMany({
    where,
    select: STATS_SELECT,
  });
}

export async function listAdminResearchForExport(
  filters: AdminResearchListFilters
): Promise<AdminResearchItem[]> {
  const baseWhere = buildPrismaWhere(filters);
  const baseRows = await fetchStatsRows(baseWhere);
  const listWhere = buildListWhere(filters, baseRows);

  const rows = await prisma.research.findMany({
    where: listWhere,
    select: RESEARCH_SELECT,
    orderBy: [{ updatedAt: "desc" }, { year: "desc" }],
  });

  return rows.map(mapResearchRow);
}

export async function getAdminResearchPageData(
  filters: AdminResearchListFilters
): Promise<AdminResearchPageData> {
  const pageSize = filters.pageSize || RESEARCH_PAGE_SIZE;
  let page = Math.max(1, filters.page);

  const baseWhere = buildPrismaWhere(filters);
  const [baseRows, filterOptions] = await Promise.all([
    fetchStatsRows(baseWhere),
    getFilterOptions(),
  ]);

  const periodCounts = computePeriodCounts(baseRows);
  const listWhere = buildListWhere(filters, baseRows);
  const filteredRows = await fetchStatsRows(listWhere);
  const { stats, chartStats } = computeUniversityResearchStats(filteredRows);

  let totalCount = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (page > totalPages && totalCount > 0) page = totalPages;

  const skip = (page - 1) * pageSize;
  const pageIds = filteredRows.slice(skip, skip + pageSize).map((r) => r.id);

  const rows =
    pageIds.length > 0
      ? await prisma.research.findMany({
          where: { id: { in: pageIds } },
          select: RESEARCH_SELECT,
          orderBy: [{ updatedAt: "desc" }, { year: "desc" }],
        })
      : [];

  const periodOptions = getPeriodOptions();
  const periodLabel = periodOptions.find((p) => p.id === filters.period)?.label ?? "الكل";

  return {
    items: rows.map(mapResearchRow),
    stats,
    chartStats,
    periodCounts,
    periodLabel,
    entities: filterOptions.entities,
    years: filterOptions.years,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      rowOffset: (page - 1) * pageSize,
    },
    filters: { ...filters, page },
  };
}
