import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { listResearch, getResearchStatsAction } from "./actions";
import { ResearchClient } from "./_components/ResearchClient";

export default async function ResearchPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("RESEARCHER")) {
    redirect("/login");
  }

  const [initialData, statsResult] = await Promise.all([
    listResearch(undefined, 1, 10),
    getResearchStatsAction(),
  ]);

  if ("error" in initialData) {
    return <div>خطأ في جلب البيانات: {initialData.error}</div>;
  }

  const stats = "error" in statsResult ? null : statsResult;

  return <ResearchClient initialData={initialData} initialStats={stats} />;
}
