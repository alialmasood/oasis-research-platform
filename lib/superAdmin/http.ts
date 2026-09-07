import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/superAdminAuth";
import { AdminServiceError } from "@/lib/superAdmin/admins";
import { UserServiceError } from "@/lib/superAdmin/users";

export async function assertSuperAdminApi() {
  const session = await requireSuperAdmin();
  if (!session) {
    return {
      session: null as null,
      error: NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 }),
    };
  }
  return { session, error: null as null };
}

export function mapAdminServiceError(error: unknown) {
  if (error instanceof AdminServiceError) {
    switch (error.code) {
      case "EMAIL_EXISTS":
        return NextResponse.json(
          { ok: false, error: "EMAIL_EXISTS", message: "البريد الإلكتروني مستخدم بالفعل" },
          { status: 409 }
        );
      case "NOT_FOUND":
        return NextResponse.json(
          { ok: false, error: "NOT_FOUND", message: "حساب الإدارة غير موجود" },
          { status: 404 }
        );
      case "ADMIN_ROLE_MISSING":
        return NextResponse.json(
          { ok: false, error: "ADMIN_ROLE_MISSING", message: "دور الإدارة غير مهيأ في النظام" },
          { status: 500 }
        );
      default:
        return NextResponse.json(
          { ok: false, error: "INTERNAL", message: "حدث خطأ غير متوقع" },
          { status: 500 }
        );
    }
  }

  if (error instanceof UserServiceError) {
    switch (error.code) {
      case "EMAIL_EXISTS":
        return NextResponse.json(
          { ok: false, error: "EMAIL_EXISTS", message: "البريد الإلكتروني مستخدم بالفعل" },
          { status: 409 }
        );
      case "NOT_FOUND":
        return NextResponse.json(
          { ok: false, error: "NOT_FOUND", message: "المستخدم غير موجود" },
          { status: 404 }
        );
      default:
        return NextResponse.json(
          { ok: false, error: "INTERNAL", message: "حدث خطأ غير متوقع" },
          { status: 500 }
        );
    }
  }

  return NextResponse.json(
    { ok: false, error: "INTERNAL", message: "حدث خطأ غير متوقع" },
    { status: 500 }
  );
}
