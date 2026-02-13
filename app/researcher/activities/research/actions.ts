"use server";

import { getSessionUser } from "@/lib/middleware";
import {
  createResearchSchema,
  updateResearchSchema,
  type CreateResearchInput,
  type UpdateResearchInput,
  type ResearchFilters,
  type ListResearchOptions,
} from "./schema";
import * as repo from "@/lib/research/researchRepo";
import { getResearchStats } from "@/lib/research/researchStats";

export async function createResearch(formData: unknown): Promise<{ error?: string; id?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = createResearchSchema.safeParse(formData);
  if (!parsed.success) {
    console.error("Validation error:", parsed.error.flatten());
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const data = parsed.data as CreateResearchInput;
  if (data.status !== "COMPLETED" && data.publishStatus != null) {
    return { error: "publishStatus مسموح فقط عندما تكون الحالة منجز" };
  }
  if (data.status === "COMPLETED" && data.publishStatus === "PUBLISHED") {
    if (!data.publishType) return { error: "نوع النشر مطلوب عند النشر" };
    if (!data.publisher?.trim()) return { error: "الناشر مطلوب عند النشر" };
    if (data.publishMonth != null && (data.publishMonth < 1 || data.publishMonth > 12)) {
      return { error: "شهر النشر يجب أن يكون بين 1 و 12" };
    }
    // التحقق من scopusQuartile فقط عند النشر
    if (data.categories?.includes("SCOPUS") && !data.scopusQuartile) {
      return { error: "تصنيف سكوبس (Q1–Q4) مطلوب عند تضمين SCOPUS" };
    }
  }

  try {
    const row = await repo.createResearch(session.id, data);
    return { id: row.id };
  } catch (e) {
    console.error("createResearch error:", e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Error details:", errorMessage);
    return { error: `فشل في إنشاء البحث: ${errorMessage}` };
  }
}

export async function updateResearch(formData: unknown): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = updateResearchSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const { id, ...data } = parsed.data as UpdateResearchInput;
  const status = data.status ?? (await repo.getResearchById(id, session.id))?.status;
  const publishStatus = data.publishStatus ?? (await repo.getResearchById(id, session.id))?.publishStatus;
  const categories = data.categories ?? (await repo.getResearchById(id, session.id))?.categories ?? [];

  if (status !== "COMPLETED" && publishStatus != null) {
    return { error: "publishStatus مسموح فقط عندما تكون الحالة منجز" };
  }
  if (categories.includes("SCOPUS") && data.scopusQuartile == null) {
    const current = await repo.getResearchById(id, session.id);
    if (!current?.scopusQuartile) return { error: "تصنيف سكوبس (Q1–Q4) مطلوب عند تضمين SCOPUS" };
  }

  try {
    const updated = await repo.updateResearch(id, session.id, data);
    if (!updated) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("updateResearch", e);
    return { error: "فشل في تحديث البحث" };
  }
}

export async function deleteResearch(id: string): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const deleted = await repo.deleteResearch(id, session.id);
    if (!deleted) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("deleteResearch", e);
    return { error: "فشل في حذف البحث" };
  }
}

export async function listResearch(
  filters?: ResearchFilters,
  page?: number,
  pageSize?: number
): Promise<
  | { error: string }
  | { items: Awaited<ReturnType<typeof repo.listResearch>>["items"]; total: number; page: number; pageSize: number; totalPages: number }
> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const result = await repo.listResearch({
      researcherId: session.id,
      filters: filters ? { ...filters, search: filters.search?.trim() || undefined } : undefined,
      page,
      pageSize,
    });
    return {
      items: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  } catch (e) {
    console.error("listResearch", e);
    return { error: "فشل في جلب القائمة" };
  }
}

export async function listResearchAll(
  filters?: ResearchFilters
): Promise<
  | { error: string }
  | { items: Awaited<ReturnType<typeof repo.listAllResearch>> }
> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const items = await repo.listAllResearch(session.id, filters ? { ...filters, search: filters.search?.trim() || undefined } : undefined);
    return { items };
  } catch (e) {
    console.error("listResearchAll error:", e);
    return { error: "فشل في تحميل بيانات الأبحاث للتصدير" };
  }
}

export async function getResearchStatsAction(): Promise<
  | { error: string }
  | Awaited<ReturnType<typeof getResearchStats>>
> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    return await getResearchStats(session.id);
  } catch (e) {
    console.error("getResearchStats", e);
    return { error: "فشل في جلب الإحصائيات" };
  }
}

export async function getResearchByIdAction(id: string) {
  const session = await getSessionUser();
  if (!session) return null;
  return repo.getResearchById(id, session.id);
}
