import { NextRequest, NextResponse } from "next/server";
import { setUserActiveState } from "@/lib/superAdmin/users";
import { assertSuperAdminApi, mapAdminServiceError } from "@/lib/superAdmin/http";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const auth = await assertSuperAdminApi();
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const user = await setUserActiveState(id, true, auth.session.email);
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return mapAdminServiceError(error);
  }
}
