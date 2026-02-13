"use server";

import { getSessionUser } from "@/lib/middleware";
import {
  addSeminarSchema,
  updateSeminarSchema,
  type AddSeminarInput,
  type UpdateSeminarInput,
} from "./schema";
import * as repo from "@/lib/researcherSeminarsRepo";

export async function createSeminar(
  formData: unknown
): Promise<{ error?: string; id?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = addSeminarSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const data = parsed.data as AddSeminarInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.date > today) {
    return { error: "التاريخ لا يمكن أن يكون في المستقبل" };
  }

  try {
    const row = await repo.createResearcherSeminar(session.id, {
      title: data.title,
      date: data.date,
      beneficiary: data.beneficiary,
      location: data.location,
      participationType: data.participationType,
      description: data.description || null,
    });
    return { id: row.id };
  } catch (e) {
    console.error("createSeminar error:", e);
    return { error: "فشل في إضافة الندوة" };
  }
}

export async function updateSeminar(
  formData: unknown
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = updateSeminarSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const { id, ...data } = parsed.data as UpdateSeminarInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.date > today) {
    return { error: "التاريخ لا يمكن أن يكون في المستقبل" };
  }

  try {
    const updated = await repo.updateResearcherSeminar(id, session.id, {
      title: data.title,
      date: data.date,
      beneficiary: data.beneficiary,
      location: data.location,
      participationType: data.participationType,
      description: data.description || null,
    });
    if (!updated) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("updateSeminar error:", e);
    return { error: "فشل في تحديث الندوة" };
  }
}

export async function deleteSeminar(id: string): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const deleted = await repo.deleteResearcherSeminar(id, session.id);
    if (!deleted) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("deleteSeminar", e);
    return { error: "فشل في حذف الندوة" };
  }
}

export async function listSeminars(filters?: repo.ResearcherSeminarFilters) {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const items = await repo.listResearcherSeminars(session.id, filters);
    return { items };
  } catch (e) {
    console.error("listSeminars", e);
    return { error: "فشل في جلب القائمة" };
  }
}
