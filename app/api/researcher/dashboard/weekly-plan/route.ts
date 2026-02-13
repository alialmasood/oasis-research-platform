import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { getWeeklyPlan } from "@/lib/weeklyPlan";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam && yearParam !== "all" ? Number(yearParam) : undefined;

  const tasks = await getWeeklyPlan(user.id, year);
  return NextResponse.json({ tasks });
}
