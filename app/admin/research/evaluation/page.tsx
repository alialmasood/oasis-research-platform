import { getAdminResearchEvaluationPageData } from "@/lib/admin/researchEvaluation";
import { ResearchEvaluationPageClient } from "../_components/ResearchEvaluationPageClient";

export default async function AdminResearchEvaluationPage() {
  const data = await getAdminResearchEvaluationPageData();

  return <ResearchEvaluationPageClient data={data} />;
}
