import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { getAvailableMonthsForYear, getAvailableYears } from "@/lib/dashboardAvailablePeriods";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");

  if (yearParam) {
    const year = Number(yearParam);
    if (Number.isNaN(year)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }
    const months = await getAvailableMonthsForYear(user.id, year);
    return NextResponse.json({ months });
  }

  const years = await getAvailableYears(user.id);
  return NextResponse.json({ years });
}
