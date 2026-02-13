import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { listResearcherSupervisions } from "@/lib/researcherSupervisionRepo";
import { SupervisionPageClient } from "./SupervisionPageClient";

export default async function SupervisionPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  const supervisions = await listResearcherSupervisions(session.id);

  return <SupervisionPageClient initialSupervisions={supervisions} />;
}
