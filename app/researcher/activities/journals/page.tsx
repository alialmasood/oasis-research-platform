import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { listJournals } from "./actions";
import { JournalsPageClient } from "./JournalsPageClient";

export default async function JournalsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.roles.includes("RESEARCHER")) {
    redirect("/");
  }

  const result = await listJournals();
  if ("error" in result) {
    return (
      <div className="p-6">
        <p className="text-red-600">خطأ: {result.error}</p>
      </div>
    );
  }

  return <JournalsPageClient initialJournals={result.items} />;
}
