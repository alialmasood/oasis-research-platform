import { NextRequest, NextResponse } from "next/server";
import {
  createSuperAdminToken,
  isSuperAdminConfigured,
  setSuperAdminSessionCookie,
  verifySuperAdminCredentials,
} from "@/lib/superAdminAuth";
import { superAdminLoginSchema } from "@/lib/validations/superAdminAuth";

export async function POST(request: NextRequest) {
  try {
    if (!isSuperAdminConfigured()) {
      return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = superAdminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const { email, password } = parsed.data;
    if (!verifySuperAdminCredentials(email, password)) {
      return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const token = await createSuperAdminToken(email);
    await setSuperAdminSessionCookie(token);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }
}
