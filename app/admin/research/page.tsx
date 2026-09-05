import { loadAdminResearchSectionPage } from "./_lib/loadResearchSectionPage";

export default async function AdminResearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return loadAdminResearchSectionPage(searchParams, "overview");
}