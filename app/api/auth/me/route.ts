import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveAuthenticatedSession } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await resolveAuthenticatedSession(token);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
