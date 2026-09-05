"use server";

import { getSessionUser } from "@/lib/middleware";
import { listAdminResearchForExport } from "@/lib/admin/researchRepo";
import type { AdminResearchItem, AdminResearchListFilters } from "@/lib/admin/researchTypes";

export async function exportAdminResearchAction(
  filters: AdminResearchListFilters
): Promise<{ items: AdminResearchItem[] } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "غير مصرح" };
  if (!user.roles.includes("ADMIN")) return { error: "غير مصرح" };

  try {
    const items = await listAdminResearchForExport(filters);
    return { items };
  } catch {
    return { error: "فشل جلب البيانات للتصدير" };
  }
}
