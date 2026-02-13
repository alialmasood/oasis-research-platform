"use server";

import { getSessionUser } from "@/lib/middleware";
import {
  addReviewingSchema,
  updateReviewingSchema,
  type AddReviewingInput,
  type UpdateReviewingInput,
} from "./schema";
import * as repo from "@/lib/researcherReviewingRepo";

export async function createReviewing(
  formData: unknown
): Promise<{ error?: string; id?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = addReviewingSchema.safeParse(formData);
  if (!parsed.success) {
    console.error("createReviewing validation error:", parsed.error);
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const data = parsed.data as AddReviewingInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.date > today) {
    return { error: "تاريخ التقويم لا يمكن أن يكون في المستقبل" };
  }

  try {
    const row = await repo.createResearcherReviewing(session.id, {
      title: data.title,
      type: data.type,
      date: data.date,
      description: data.description ?? null,
      status: data.status,
    });
    return { id: row.id };
  } catch (e) {
    console.error("createReviewing error:", e);
    return { error: `فشل في إضافة التقويم: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function updateReviewing(
  formData: unknown
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = updateReviewingSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const { id, ...data } = parsed.data as UpdateReviewingInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.date > today) {
    return { error: "تاريخ التقويم لا يمكن أن يكون في المستقبل" };
  }

  try {
    const updated = await repo.updateResearcherReviewing(id, session.id, {
      title: data.title,
      type: data.type,
      date: data.date,
      description: data.description ?? null,
      status: data.status,
    });
    if (!updated) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("updateReviewing error:", e);
    return { error: "فشل في تحديث التقويم" };
  }
}

export async function deleteReviewing(id: string): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const deleted = await repo.deleteResearcherReviewing(id, session.id);
    if (!deleted) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("deleteReviewing", e);
    return { error: "فشل في حذف التقويم" };
  }
}

export async function listReviewings(filters?: repo.ResearcherReviewingFilters) {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const items = await repo.listResearcherReviewings(session.id, filters);
    return { items };
  } catch (e) {
    console.error("listReviewings", e);
    return { error: "فشل في جلب القائمة" };
  }
}
