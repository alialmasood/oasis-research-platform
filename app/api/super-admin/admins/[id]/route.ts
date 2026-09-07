import { NextRequest, NextResponse } from "next/server";
import { getAdminById, updateAdmin } from "@/lib/superAdmin/admins";
import { assertSuperAdminApi, mapAdminServiceError } from "@/lib/superAdmin/http";
import { updateAdminSchema } from "@/lib/validations/superAdminAdmins";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await assertSuperAdminApi();
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const admin = await getAdminById(id);
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND", message: "حساب الإدارة غير موجود" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, admin });
  } catch (error) {
    return mapAdminServiceError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await assertSuperAdminApi();
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = updateAdminSchema.safeParse(body);
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

    const admin = await updateAdmin(id, parsed.data, auth.session.email);
    return NextResponse.json({ ok: true, admin });
  } catch (error) {
    return mapAdminServiceError(error);
  }
}
