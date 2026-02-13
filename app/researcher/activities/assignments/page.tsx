import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { listAssignments } from "./actions";
import { AssignmentsPageClient } from "./AssignmentsPageClient";

export default async function AssignmentsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("RESEARCHER")) {
    redirect("/login");
  }

  const result = await listAssignments();

  if ("error" in result) {
    return <div className="p-6">خطأ في جلب البيانات: {result.error}</div>;
  }

  return <AssignmentsPageClient initialAssignments={result.items} />;
}
