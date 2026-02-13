import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { getDashboardChartsData } from "@/lib/dashboardCharts";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const typeParam = (searchParams.get("type") ?? "all") as "all" | "research" | "activities";

  const year = yearParam && yearParam !== "all" ? Number(yearParam) : undefined;
  const month = monthParam && monthParam !== "all" ? Number(monthParam) : undefined;

  const charts = await getDashboardChartsData({
    userId: user.id,
    year,
    month,
    type: typeParam,
  });

  return NextResponse.json({ charts });
}
