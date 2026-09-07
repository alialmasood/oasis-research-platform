import { NextRequest, NextResponse } from "next/server";
import { setAdminActiveState } from "@/lib/superAdmin/admins";
import { assertSuperAdminApi, mapAdminServiceError } from "@/lib/superAdmin/http";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const auth = await assertSuperAdminApi();
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const admin = await setAdminActiveState(id, false, auth.session.email);
    return NextResponse.json({ ok: true, admin });
  } catch (error) {
    return mapAdminServiceError(error);
  }
}
