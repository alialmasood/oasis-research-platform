import { NextRequest, NextResponse } from "next/server";
import { resetAdminPassword } from "@/lib/superAdmin/admins";
import { assertSuperAdminApi, mapAdminServiceError } from "@/lib/superAdmin/http";
import { resetAdminPasswordSchema } from "@/lib/validations/superAdminAdmins";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await assertSuperAdminApi();
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = resetAdminPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_INPUT",
          message: parsed.error.issues[0]?.message ?? "بيانات غير صالحة",
        },
        { status: 400 }
      );
    }

    await resetAdminPassword(id, parsed.data.password, auth.session.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return mapAdminServiceError(error);
  }
}
