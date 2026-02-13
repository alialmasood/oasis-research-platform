import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { listVolunteerings } from "./actions";
import { VolunteeringPageClient } from "./VolunteeringPageClient";

export default async function VolunteeringPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  const result = await listVolunteerings();
  if ("error" in result) {
    return <div className="p-6 text-red-600">خطأ: {result.error}</div>;
  }

  return <VolunteeringPageClient initialVolunteerings={result.items} />;
}
