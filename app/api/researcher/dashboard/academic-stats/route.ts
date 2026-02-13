import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import {
  emptyAcademicActivityStats,
  getAcademicActivityStats,
} from "@/lib/researcherAcademicStats";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const type = searchParams.get("type") ?? "all";

  const year = yearParam && yearParam !== "all" ? Number(yearParam) : undefined;
  const month = monthParam && monthParam !== "all" ? Number(monthParam) : undefined;

  const filtered =
    type === "research"
      ? emptyAcademicActivityStats()
      : await getAcademicActivityStats(user.id, { year, month });

  return NextResponse.json({ filtered });
}
