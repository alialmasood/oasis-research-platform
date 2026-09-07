import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { ResearchDataClient } from "./ResearchDataClient";

export default async function ResearcherResearchDataPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.roles.includes("RESEARCHER")) redirect("/login");

  return <ResearchDataClient />;
}
