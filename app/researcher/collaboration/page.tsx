import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { CollaborationPageClient } from "./CollaborationPageClient";

export default async function CollaborationPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.roles.includes("RESEARCHER")) redirect("/login");

  return <CollaborationPageClient />;
}
