import { getAdminResearcherIndicatorsPageData } from "@/lib/admin/researchResearcherGaps";
import { ResearchIndicatorsPageClient } from "../_components/ResearchIndicatorsPageClient";

export default async function AdminResearchIndicatorsPage() {
  const data = await getAdminResearcherIndicatorsPageData();

  return <ResearchIndicatorsPageClient data={data} />;
}
