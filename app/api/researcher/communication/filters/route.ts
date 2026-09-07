import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import { getDirectoryFilters } from "@/lib/communicationRepo";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.roles.includes("RESEARCHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filters = await getDirectoryFilters();
  return NextResponse.json(filters);
}
