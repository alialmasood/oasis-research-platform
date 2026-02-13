import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { getRecentActivities } from "@/lib/recentActivities";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sorted = await getRecentActivities(user.id);

  return NextResponse.json({ activities: sorted });
}
