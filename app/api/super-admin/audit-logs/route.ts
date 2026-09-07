import { NextRequest, NextResponse } from "next/server";
import { listAuditLogs } from "@/lib/superAdmin/audit";
import { assertSuperAdminApi, mapAdminServiceError } from "@/lib/superAdmin/http";
import { auditLogsQuerySchema } from "@/lib/validations/superAdminAudit";

export async function GET(request: NextRequest) {
  const auth = await assertSuperAdminApi();
  if (auth.error) return auth.error;

  try {
    const url = new URL(request.url);
    const parsed = auditLogsQuerySchema.safeParse({
      search: url.searchParams.get("search") ?? undefined,
      action: url.searchParams.get("action") ?? undefined,
      targetType: url.searchParams.get("targetType") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });

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

    const result = await listAuditLogs(parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return mapAdminServiceError(error);
  }
}
