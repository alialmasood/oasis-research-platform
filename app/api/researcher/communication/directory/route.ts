import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { getDirectoryResearchers } from "@/lib/communicationRepo";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.roles.includes("RESEARCHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "25");

  const result = await getDirectoryResearchers({
    currentUserId: user.id,
    q: searchParams.get("q") ?? undefined,
    college: searchParams.get("college") ?? undefined,
    department: searchParams.get("department") ?? undefined,
    specialization: searchParams.get("specialization") ?? undefined,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 25,
  });

  return NextResponse.json(result);
}
