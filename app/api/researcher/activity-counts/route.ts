import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { getResearcherActivityCounts } from "@/lib/researcherActivityCounts";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const counts = await getResearcherActivityCounts(user.id);
  return NextResponse.json({ counts });
}
