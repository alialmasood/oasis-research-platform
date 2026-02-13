import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { getAggregatedCounts } from "@/lib/evaluationAggregate";
import { getGoals } from "@/lib/researcherGoalsRepo";
import { computeOverallScore } from "@/app/researcher/evaluation/types";
import { buildEvaluationSuggestions } from "@/lib/evaluationSuggestions";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam && yearParam !== "all" ? Number(yearParam) : undefined;

  const aggregates = await getAggregatedCounts(user.id, year ? { year } : undefined);
  const goals = year ? await getGoals(user.id, year) : null;
  const score = computeOverallScore(aggregates);
  const suggestions = buildEvaluationSuggestions({ aggregates, goals, totalScore: score });

  return NextResponse.json({ score, suggestions });
}
