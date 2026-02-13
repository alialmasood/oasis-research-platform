import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { listPositions } from "./actions";
import { PositionsPageClient } from "./PositionsPageClient";

export default async function PositionsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("RESEARCHER")) {
    redirect("/login");
  }

  const result = await listPositions();

  if ("error" in result) {
    return <div className="p-6">خطأ في جلب البيانات: {result.error}</div>;
  }

  return <PositionsPageClient initialPositions={result.items} />;
}
