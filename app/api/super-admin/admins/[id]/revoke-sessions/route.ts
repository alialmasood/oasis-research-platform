import { NextRequest, NextResponse } from "next/server";
import { revokeAdminSessions } from "@/lib/superAdmin/admins";
import { assertSuperAdminApi, mapAdminServiceError } from "@/lib/superAdmin/http";
import { revokeSessionsParamsSchema } from "@/lib/validations/superAdminAudit";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const auth = await assertSuperAdminApi();
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const parsed = revokeSessionsParamsSchema.safeParse({ id });
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

    const admin = await revokeAdminSessions(parsed.data.id, auth.session.email);
    return NextResponse.json({ ok: true, admin });
  } catch (error) {
    return mapAdminServiceError(error);
  }
}
