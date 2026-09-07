import { NextResponse } from "next/server";
import { getSuperAdminSession } from "@/lib/superAdminAuth";

export async function GET() {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    email: session.email,
  });
}
