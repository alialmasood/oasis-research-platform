"use server";

import { getSessionUser } from "@/lib/middleware";
import {
  addWorkshopSchema,
  updateWorkshopSchema,
  type AddWorkshopInput,
  type UpdateWorkshopInput,
} from "./schema";
import * as repo from "@/lib/researcherWorkshopsRepo";

export async function createWorkshop(
  formData: unknown
): Promise<{ error?: string; id?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = addWorkshopSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const data = parsed.data as AddWorkshopInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.date > today) {
    return { error: "التاريخ لا يمكن أن يكون في المستقبل" };
  }

  try {
    const row = await repo.createResearcherWorkshop(session.id, {
      title: data.title,
      date: data.date,
      beneficiary: data.beneficiary,
      location: data.location,
      participationType: data.participationType,
      description: data.description || null,
    });
    return { id: row.id };
  } catch (e) {
    console.error("createWorkshop error:", e);
    return { error: "فشل في إضافة ورشة العمل" };
  }
}

export async function updateWorkshop(
  formData: unknown
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = updateWorkshopSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const { id, ...data } = parsed.data as UpdateWorkshopInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.date > today) {
    return { error: "التاريخ لا يمكن أن يكون في المستقبل" };
  }

  try {
    const updated = await repo.updateResearcherWorkshop(id, session.id, {
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
    console.error("updateWorkshop error:", e);
    return { error: "فشل في تحديث ورشة العمل" };
  }
}

export async function deleteWorkshop(id: string): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const deleted = await repo.deleteResearcherWorkshop(id, session.id);
    if (!deleted) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("deleteWorkshop", e);
    return { error: "فشل في حذف ورشة العمل" };
  }
}

export async function listWorkshops(filters?: repo.ResearcherWorkshopFilters) {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const items = await repo.listResearcherWorkshops(session.id, filters);
    return { items };
  } catch (e) {
    console.error("listWorkshops", e);
    return { error: "فشل في جلب القائمة" };
  }
}
