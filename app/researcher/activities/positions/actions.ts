"use server";

import { getSessionUser } from "@/lib/middleware";
import {
  addPositionSchema,
  updatePositionSchema,
  type AddPositionInput,
  type UpdatePositionInput,
} from "./schema";
import * as repo from "@/lib/researcherPositionsRepo";

export async function createPosition(
  formData: unknown
): Promise<{ error?: string; id?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = addPositionSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const data = parsed.data as AddPositionInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.positionDate > today) {
    return { error: "التاريخ لا يمكن أن يكون في المستقبل" };
  }

  // التحقق من أن المدة > 0
  if (
    data.durationYears === 0 &&
    data.durationMonths === 0 &&
    data.durationDays === 0
  ) {
    return { error: "يجب أن تكون مدة المنصب أكبر من صفر" };
  }

  try {
    const row = await repo.createResearcherPosition(session.id, {
      title: data.title,
      positionDate: data.positionDate,
      durationYears: data.durationYears,
      durationMonths: data.durationMonths,
      durationDays: data.durationDays,
      organization: data.organization,
      description: data.description || null,
    });
    return { id: row.id };
  } catch (e) {
    console.error("createPosition error:", e);
    return { error: "فشل في إضافة المنصب" };
  }
}

export async function updatePosition(
  formData: unknown
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = updatePositionSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const { id, ...data } = parsed.data as UpdatePositionInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.positionDate > today) {
    return { error: "التاريخ لا يمكن أن يكون في المستقبل" };
  }

  // التحقق من أن المدة > 0
  if (
    data.durationYears === 0 &&
    data.durationMonths === 0 &&
    data.durationDays === 0
  ) {
    return { error: "يجب أن تكون مدة المنصب أكبر من صفر" };
  }

  try {
    const updated = await repo.updateResearcherPosition(id, session.id, {
      title: data.title,
      positionDate: data.positionDate,
      durationYears: data.durationYears,
      durationMonths: data.durationMonths,
      durationDays: data.durationDays,
      organization: data.organization,
      description: data.description || null,
    });
    if (!updated) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("updatePosition error:", e);
    return { error: "فشل في تحديث المنصب" };
  }
}

export async function deletePosition(id: string): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const deleted = await repo.deleteResearcherPosition(id, session.id);
    if (!deleted) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("deletePosition", e);
    return { error: "فشل في حذف المنصب" };
  }
}

export async function listPositions(filters?: repo.ResearcherPositionFilters) {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const items = await repo.listResearcherPositions(session.id, filters);
    return { items };
  } catch (e) {
    console.error("listPositions", e);
    return { error: "فشل في جلب القائمة" };
  }
}
