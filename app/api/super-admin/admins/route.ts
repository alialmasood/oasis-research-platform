import { NextRequest, NextResponse } from "next/server";
import { createAdmin, listAdmins } from "@/lib/superAdmin/admins";
import { assertSuperAdminApi, mapAdminServiceError } from "@/lib/superAdmin/http";
import { createAdminSchema } from "@/lib/validations/superAdminAdmins";

export async function GET() {
  const auth = await assertSuperAdminApi();
  if (auth.error) return auth.error;

  try {
    const admins = await listAdmins();
    return NextResponse.json({ ok: true, admins });
  } catch (error) {
    return mapAdminServiceError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await assertSuperAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => null);
    const parsed = createAdminSchema.safeParse(body);
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

    const admin = await createAdmin(parsed.data, auth.session.email);
    return NextResponse.json({ ok: true, admin }, { status: 201 });
  } catch (error) {
    return mapAdminServiceError(error);
  }
}
