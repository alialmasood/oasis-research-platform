"use server";

import { getSessionUser } from "@/lib/middleware";
import {
  addThankYouLetterSchema,
  updateThankYouLetterSchema,
  type AddThankYouLetterInput,
  type UpdateThankYouLetterInput,
} from "./schema";
import * as repo from "@/lib/researcherThanksRepo";

export async function createThankYouLetter(
  formData: unknown
): Promise<{ error?: string; id?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = addThankYouLetterSchema.safeParse(formData);
  if (!parsed.success) {
    console.error("createThankYouLetter validation error:", parsed.error);
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const data = parsed.data as AddThankYouLetterInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.date > today) {
    return { error: "التاريخ لا يمكن أن يكون في المستقبل" };
  }

  try {
    const row = await repo.createResearcherThankYouLetter(session.id, {
      issuingOrganization: data.issuingOrganization,
      reason: data.reason,
      date: data.date,
      participationType: data.participationType ?? null,
      description: data.description ?? null,
    });
    return { id: row.id };
  } catch (e) {
    console.error("createThankYouLetter error:", e);
    return { error: `فشل في إضافة كتاب الشكر: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function updateThankYouLetter(
  formData: unknown
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = updateThankYouLetterSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const { id, ...data } = parsed.data as UpdateThankYouLetterInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.date > today) {
    return { error: "التاريخ لا يمكن أن يكون في المستقبل" };
  }

  try {
    const updated = await repo.updateResearcherThankYouLetter(id, session.id, {
      issuingOrganization: data.issuingOrganization,
      reason: data.reason,
      date: data.date,
      participationType: data.participationType || null,
      description: data.description || null,
    });
    if (!updated) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("updateThankYouLetter error:", e);
    return { error: "فشل في تحديث كتاب الشكر" };
  }
}

export async function deleteThankYouLetter(id: string): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const deleted = await repo.deleteResearcherThankYouLetter(id, session.id);
    if (!deleted) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("deleteThankYouLetter", e);
    return { error: "فشل في حذف كتاب الشكر" };
  }
}

export async function listThankYouLetters(filters?: repo.ResearcherThankYouLetterFilters) {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const items = await repo.listResearcherThankYouLetters(session.id, filters);
    return { items };
  } catch (e) {
    console.error("listThankYouLetters", e);
    return { error: "فشل في جلب القائمة" };
  }
}
