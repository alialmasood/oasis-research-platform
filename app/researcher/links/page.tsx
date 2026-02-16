import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { LinksPageClient } from "./LinksPageClient";

export default async function ResearcherLinksPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.roles.includes("RESEARCHER")) redirect("/login");

  return <LinksPageClient />;
}
