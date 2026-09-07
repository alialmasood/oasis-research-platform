import { NextResponse } from "next/server";
import { getAdminStats } from "@/lib/superAdmin/admins";
import { getPlatformStats } from "@/lib/superAdmin/users";
import { assertSuperAdminApi, mapAdminServiceError } from "@/lib/superAdmin/http";

export async function GET() {
  const auth = await assertSuperAdminApi();
  if (auth.error) return auth.error;

  try {
    const [platform, admins] = await Promise.all([getPlatformStats(), getAdminStats()]);
    return NextResponse.json({
      ok: true,
      stats: {
        ...platform,
        activeAdmins: admins.active,
        disabledAdmins: admins.disabled,
      },
    });
  } catch (error) {
    return mapAdminServiceError(error);
  }
}
