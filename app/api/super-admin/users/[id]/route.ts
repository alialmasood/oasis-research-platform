import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser } from "@/lib/superAdmin/users";
import { assertSuperAdminApi, mapAdminServiceError } from "@/lib/superAdmin/http";
import { updatePlatformUserSchema } from "@/lib/validations/superAdminUsers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await assertSuperAdminApi();
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND", message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, user });
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
    const parsed = updatePlatformUserSchema.safeParse(body);
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

    const user = await updateUser(id, parsed.data, auth.session.email);
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return mapAdminServiceError(error);
  }
}
