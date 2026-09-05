import { loadAdminResearchSectionPage } from "../_lib/loadResearchSectionPage";

export default function AdminInternationalResearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return loadAdminResearchSectionPage(searchParams, "international");
}
