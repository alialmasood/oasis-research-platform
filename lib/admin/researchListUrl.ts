import type { AdminResearchListFilters } from "./researchTypes";
import type { ResearchPeriod } from "./researchPeriods";

export type AdminResearchSection = "overview" | "international" | "scopus";

export const ADMIN_RESEARCH_SECTIONS: Record<
  AdminResearchSection,
  {
    basePath: string;
    fixedCategory: string;
    title: string;
    description: string;
  }
> = {
  overview: {
    basePath: "/admin/research",
    fixedCategory: "",
    title: "البحوث",
    description:
      "رؤية شاملة للنشاط البحثي على مستوى الجامعة — البحوث المسجلة، نسب الإنجاز، والنشر العلمي",
  },
  international: {
    basePath: "/admin/research/international",
    fixedCategory: "INTERNATIONAL",
    title: "البحوث العالمية",
    description: "بحوث مصنّفة «عالمي» — إحصاءات، رسوم، وجدول تفصيلي على مستوى الجامعة",
  },
  scopus: {
    basePath: "/admin/research/scopus",
    fixedCategory: "SCOPUS",
    title: "بحوث سكوبس",
    description:
      "رؤية تفصيلية لبحوث SCOPUS — الأرباع، النشر، DOI، والإنجاز على مستوى الجامعة",
  },
};

export function buildResearchListUrl(
  filters: Partial<AdminResearchListFilters> & { page?: number },
  section: AdminResearchSection = "overview"
): string {
  const { basePath, fixedCategory } = ADMIN_RESEARCH_SECTIONS[section];
  const params = new URLSearchParams();
  const page = filters.page ?? 1;
  if (page > 1) params.set("page", String(page));

  const search = filters.search?.trim();
  if (search) params.set("q", search);

  if (filters.period && filters.period !== "all") params.set("period", filters.period);
  if (filters.status) params.set("status", filters.status);
  if (filters.publishStatus) params.set("publishStatus", filters.publishStatus);
  if (filters.researchType) params.set("researchType", filters.researchType);
  if (filters.year) params.set("year", filters.year);
  if (filters.entity) params.set("entity", filters.entity);
  if (!fixedCategory && filters.category) params.set("category", filters.category);
  if (filters.publishType) params.set("publishType", filters.publishType);
  if (filters.scopusQuartile) params.set("scopusQuartile", filters.scopusQuartile);

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function parseResearchListFilters(
  searchParams: Record<string, string | string[] | undefined>,
  section: AdminResearchSection = "overview"
): AdminResearchListFilters {
  const get = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" ? value : "";
  };

  const period = get("period") as ResearchPeriod;
  const validPeriods: ResearchPeriod[] = ["all", "month", "year", "academic", "semester"];
  const { fixedCategory } = ADMIN_RESEARCH_SECTIONS[section];

  return {
    page: Math.max(1, parseInt(get("page"), 10) || 1),
    pageSize: 50,
    search: get("q"),
    period: validPeriods.includes(period) ? period : "all",
    status: get("status"),
    publishStatus: get("publishStatus"),
    researchType: get("researchType"),
    year: get("year"),
    entity: get("entity"),
    category: fixedCategory || get("category"),
    publishType: get("publishType"),
    scopusQuartile: get("scopusQuartile"),
  };
}
