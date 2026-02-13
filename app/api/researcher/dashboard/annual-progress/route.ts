import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { getAnnualProgressData } from "@/lib/annualProgress";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  if (Number.isNaN(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const progress = await getAnnualProgressData(user.id, year);
  return NextResponse.json({ progress });
}
