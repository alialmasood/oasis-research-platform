import { getAdminResearchPageData } from "@/lib/admin/researchRepo";
import { parseResearchListFilters } from "@/lib/admin/researchListUrl";
import { ResearchScopusPageClient } from "../_components/ResearchScopusPageClient";

export default async function AdminScopusResearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseResearchListFilters(params, "scopus");
  const data = await getAdminResearchPageData(filters);

  return <ResearchScopusPageClient data={data} />;
}
