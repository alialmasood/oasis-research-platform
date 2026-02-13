import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { listCommittees } from "./actions";
import { CommitteesPageClient } from "./CommitteesPageClient";

export default async function CommitteesPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("RESEARCHER")) {
    redirect("/login");
  }

  const result = await listCommittees();

  if ("error" in result) {
    return <div className="p-6">خطأ في جلب البيانات: {result.error}</div>;
  }

  return <CommitteesPageClient initialCommittees={result.items} />;
}
