import { NextRequest, NextResponse } from "next/server";
import { listRoleNames, listUsers } from "@/lib/superAdmin/users";
import { assertSuperAdminApi, mapAdminServiceError } from "@/lib/superAdmin/http";
import { usersListQuerySchema } from "@/lib/validations/superAdminUsers";

export async function GET(request: NextRequest) {
  const auth = await assertSuperAdminApi();
  if (auth.error) return auth.error;

  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = usersListQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_INPUT",
          message: parsed.error.issues[0]?.message ?? "معاملات غير صالحة",
        },
        { status: 400 }
      );
    }

    const result = await listUsers(parsed.data);
    const roles = await listRoleNames();
    return NextResponse.json({
      ok: true,
      items: result.items,
      pagination: result.pagination,
      roles,
    });
  } catch (error) {
    return mapAdminServiceError(error);
  }
}
