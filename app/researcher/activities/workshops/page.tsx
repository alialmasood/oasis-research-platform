import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { listWorkshops } from "./actions";
import { WorkshopsPageClient } from "./WorkshopsPageClient";

export default async function WorkshopsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("RESEARCHER")) {
    redirect("/login");
  }

  const result = await listWorkshops();

  if ("error" in result) {
    return <div className="p-6">خطأ في جلب البيانات: {result.error}</div>;
  }

  return <WorkshopsPageClient initialWorkshops={result.items} />;
}
