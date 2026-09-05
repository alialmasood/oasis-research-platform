import { getAdminResearchPageData } from "@/lib/admin/researchRepo";
import {
  parseResearchListFilters,
  type AdminResearchSection,
} from "@/lib/admin/researchListUrl";
import { ResearchPageClient } from "../_components/ResearchPageClient";

export async function loadAdminResearchSectionPage(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
  section: AdminResearchSection
) {
  const params = await searchParams;
  const filters = parseResearchListFilters(params, section);
  const data = await getAdminResearchPageData(filters);
  return <ResearchPageClient data={data} section={section} />;
}
