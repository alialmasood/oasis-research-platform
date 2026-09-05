import type { FacultyListFilters } from "./facultyTypes";

export function buildFacultyListUrl(filters: Partial<FacultyListFilters> & { page?: number }): string {
  const params = new URLSearchParams();

  const page = filters.page ?? 1;
  if (page > 1) params.set("page", String(page));

  const search = filters.search?.trim();
  if (search) params.set("q", search);

  if (filters.entity) params.set("entity", filters.entity);
  if (filters.department) params.set("department", filters.department);
  if (filters.degree) params.set("degree", filters.degree);
  if (filters.completion && filters.completion !== "all") {
    params.set("completion", filters.completion);
  }

  const query = params.toString();
  return query ? `/admin/faculty?${query}` : "/admin/faculty";
}

export function parseFacultyListFilters(
  searchParams: Record<string, string | string[] | undefined>
): FacultyListFilters {
  const get = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" ? value : "";
  };

  const page = Math.max(1, parseInt(get("page"), 10) || 1);

  return {
    page,
    pageSize: 50,
    search: get("q"),
    entity: get("entity"),
    department: get("department"),
    degree: get("degree"),
    completion: get("completion") || "all",
  };
}
