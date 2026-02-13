import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { getEvaluationData } from "./actions";
import { EvaluationPageClient } from "./EvaluationPageClient";

export default async function EvaluationPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.roles.includes("RESEARCHER")) redirect("/login");

  const result = await getEvaluationData(null);
  if ("error" in result) {
    return (
      <div className="p-6 text-red-600">
        خطأ: {result.error}
      </div>
    );
  }

  return (
    <EvaluationPageClient
      initialAggregates={result.aggregates}
      initialGoals={result.goals}
      initialAvailableYears={result.availableYears}
      initialPeriod={result.period}
      initialPreviousAggregates={result.previousAggregates ?? null}
    />
  );
}
