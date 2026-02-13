import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { listConferences } from "./actions";
import { ConferencesPageClient } from "./ConferencesPageClient";

export default async function ConferencesPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("RESEARCHER")) {
    redirect("/login");
  }

  const result = await listConferences();

  if ("error" in result) {
    return <div className="p-6">خطأ في جلب البيانات: {result.error}</div>;
  }

  return <ConferencesPageClient initialConferences={result.items} />;
}
