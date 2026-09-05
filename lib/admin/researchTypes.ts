import type { ResearchPeriod } from "./researchPeriods";
import type { ResearchStats } from "@/lib/research/researchStats";

export const RESEARCH_PAGE_SIZE = 50;

export const SCOPUS_QUARTILE_LABELS: Record<string, string> = {
  Q1: "Q1",
  Q2: "Q2",
  Q3: "Q3",
  Q4: "Q4",
};

export const RESEARCH_TYPE_LABELS: Record<string, string> = {
  PLANNED: "مخطط",
  UNPLANNED: "غير مخطط",
};

export const RESEARCH_STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "غير منجز",
  COMPLETED: "منجز",
};

export const PUBLISH_STATUS_LABELS: Record<string, string> = {
  DRAFT: "غير منشور",
  PUBLISHED: "منشور",
};

export const PUBLISH_TYPE_LABELS: Record<string, string> = {
  JOURNAL: "مجلة",
  CONFERENCE: "مؤتمر",
  BOOK_CHAPTER: "فصل كتاب",
  REPORT: "تقرير",
  OTHER: "أخرى",
};

export const OWNERSHIP_LABELS: Record<string, string> = {
  INDIVIDUAL: "فردي",
  TEAM: "فريق",
  INSTITUTIONAL: "مؤسسي",
};

export const CATEGORY_LABELS: Record<string, string> = {
  SCOPUS: "SCOPUS",
  ISI: "ISI",
  LOCAL: "محلي",
  INTERNATIONAL: "عالمي",
};

export type AdminResearchResearcher = {
  id: string;
  displayName: string;
  email: string;
  entity: string | null;
  department: string | null;
  academicTitle: string | null;
};

export type AdminResearchItem = {
  id: string;
  title: string;
  researchType: string;
  researchTypeLabel: string;
  ownership: string;
  ownershipLabel: string;
  status: string;
  statusLabel: string;
  progressPercent: number | null;
  year: number;
  publishStatus: string | null;
  publishStatusLabel: string | null;
  publishType: string | null;
  publishTypeLabel: string | null;
  publishMonth: number | null;
  publishMonthLabel: string | null;
  publisher: string | null;
  doi: string | null;
  categories: string[];
  categoriesLabel: string;
  scopusQuartile: string | null;
  researchUrl: string | null;
  createdAt: string;
  updatedAt: string;
  researcher: AdminResearchResearcher;
};

export type AdminResearchStats = {
  total: number;
  planned: number;
  unplanned: number;
  completed: number;
  inProgress: number;
  published: number;
  unpublished: number;
  international: number;
  local: number;
  individual: number;
  scopus: number;
  isi: number;
  avgProgressInProgress: number;
  researchersWithResearch: number;
};

export type AdminResearchPeriodCounts = {
  month: number;
  year: number;
  academic: number;
  semester: number;
};

/** مؤشرات «فجوات» الباحثين — قابلة للتوسيع */
export type AdminResearcherGapMetricId =
  | "no_research"
  | "no_scopus"
  | "no_academic_activity";

export type AdminResearcherGapMetric = {
  id: AdminResearcherGapMetricId;
  label: string;
  description: string;
  count: number;
  totalResearchers: number;
};

export type AdminResearcherGapMember = {
  id: string;
  displayName: string;
  entity: string | null;
  academicTitle: string | null;
  highestDegree: string | null;
};

export type AdminResearcherGapTable = {
  id: AdminResearcherGapMetricId;
  title: string;
  description: string;
  count: number;
  members: AdminResearcherGapMember[];
};

export type AdminResearcherOrgInsightId =
  | "entity_most_no_research"
  | "department_most_no_research"
  | "entity_fewest_scopus_publishers"
  | "department_fewest_scopus_publishers"
  | "entity_least_academic_activity"
  | "department_least_academic_activity";

export type AdminResearcherOrgInsight = {
  id: AdminResearcherOrgInsightId;
  title: string;
  description: string;
  groupName: string;
  count: number;
  totalInGroup: number;
};

export type AdminResearcherIndicatorsPageData = {
  totalResearchers: number;
  academicYearLabel: string;
  metrics: AdminResearcherGapMetric[];
  tables: AdminResearcherGapTable[];
  orgInsights: AdminResearcherOrgInsight[];
};

export type AdminResearchListFilters = {
  page: number;
  pageSize: number;
  search: string;
  period: ResearchPeriod;
  status: string;
  publishStatus: string;
  researchType: string;
  year: string;
  entity: string;
  category: string;
  publishType: string;
  scopusQuartile: string;
};

export type AdminResearchPagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  rowOffset: number;
};

export type AdminResearchPageData = {
  items: AdminResearchItem[];
  stats: AdminResearchStats;
  chartStats: ResearchStats;
  periodCounts: AdminResearchPeriodCounts;
  periodLabel: string;
  entities: string[];
  years: number[];
  pagination: AdminResearchPagination;
  filters: AdminResearchListFilters;
};

export type AdminResearchEvaluationEntry = {
  id: string;
  displayName: string;
  entity: string | null;
  department: string | null;
  academicTitle: string | null;
  score: number;
  researchCount: number;
  activitiesTotal: number;
};

export type AdminResearchEvaluationPageData = {
  academicYearLabel: string;
  evaluationYear: number;
  totalResearchers: number;
  averageScore: number;
  excellentCount: number;
  goodCount: number;
  needsImprovementCount: number;
  entries: AdminResearchEvaluationEntry[];
  entities: string[];
};
