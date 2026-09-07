import { NextResponse } from "next/server";
import { clearSuperAdminSessionCookie } from "@/lib/superAdminAuth";

export async function POST() {
  await clearSuperAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
