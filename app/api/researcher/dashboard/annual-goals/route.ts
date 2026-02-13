import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { setGoals } from "@/lib/researcherGoalsRepo";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    year?: number;
    goals?: Record<string, number>;
  };

  const year = body.year;
  if (!year || Number.isNaN(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }
  const goals = body.goals ?? {};

  await setGoals(user.id, year, goals);
  return NextResponse.json({ success: true });
}
