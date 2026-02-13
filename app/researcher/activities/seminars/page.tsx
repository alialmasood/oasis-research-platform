import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { listSeminars } from "./actions";
import { SeminarsPageClient } from "./SeminarsPageClient";

export default async function SeminarsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("RESEARCHER")) {
    redirect("/login");
  }

  const result = await listSeminars();

  if ("error" in result) {
    return <div className="p-6">خطأ في جلب البيانات: {result.error}</div>;
  }

  return <SeminarsPageClient initialSeminars={result.items} />;
}
