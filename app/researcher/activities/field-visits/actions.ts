"use server";

import { getSessionUser } from "@/lib/middleware";
import {
  addFieldVisitSchema,
  updateFieldVisitSchema,
  type AddFieldVisitInput,
  type UpdateFieldVisitInput,
} from "./schema";
import * as repo from "@/lib/researcherFieldVisitsRepo";

export async function createFieldVisit(
  formData: unknown
): Promise<{ error?: string; id?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = addFieldVisitSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const data = parsed.data as AddFieldVisitInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.activityDate > today) {
    return { error: "تاريخ النشاط لا يمكن أن يكون في المستقبل" };
  }

  try {
    const row = await repo.createFieldVisit(session.id, {
      type: data.type as "FIELD_VISIT_SUPERVISION" | "VOLUNTARY_INSIDE_MINISTRY" | "SERVICE_OUTSIDE_MINISTRY",
      title: data.title,
      activityDate: data.activityDate,
      description: data.description ?? null,
      documentationRef: data.documentationRef ?? null,
    });
    return { id: row.id };
  } catch (e) {
    console.error("createFieldVisit error:", e);
    return { error: `فشل في إضافة الزيارة الميدانية: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function updateFieldVisit(
  formData: unknown
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = updateFieldVisitSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const { id, ...data } = parsed.data as UpdateFieldVisitInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.activityDate > today) {
    return { error: "تاريخ النشاط لا يمكن أن يكون في المستقبل" };
  }

  try {
    const updated = await repo.updateFieldVisit(id, session.id, {
      type: data.type as "FIELD_VISIT_SUPERVISION" | "VOLUNTARY_INSIDE_MINISTRY" | "SERVICE_OUTSIDE_MINISTRY",
      title: data.title,
      activityDate: data.activityDate,
      description: data.description ?? null,
      documentationRef: data.documentationRef ?? null,
    });
    if (!updated) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("updateFieldVisit error:", e);
    return { error: "فشل في تحديث السجل" };
  }
}

export async function deleteFieldVisit(id: string): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const deleted = await repo.deleteFieldVisit(id, session.id);
    if (!deleted) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("deleteFieldVisit", e);
    return { error: "فشل في حذف السجل" };
  }
}

export async function listFieldVisits(filters?: repo.FieldVisitFilters) {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const items = await repo.listFieldVisits(session.id, filters);
    return { items };
  } catch (e) {
    console.error("listFieldVisits", e);
    return { error: "فشل في جلب القائمة" };
  }
}
