import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { listFieldVisits } from "./actions";
import { FieldVisitsPageClient } from "./FieldVisitsPageClient";

export default async function FieldVisitsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.roles.includes("RESEARCHER")) redirect("/login");

  const result = await listFieldVisits();
  if ("error" in result) {
    return (
      <div className="p-6 text-red-600">
        خطأ: {result.error}
      </div>
    );
  }

  return <FieldVisitsPageClient initialItems={result.items} />;
}
