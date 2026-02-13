"use server";

import { getSessionUser } from "@/lib/middleware";
import {
  addJournalSchema,
  updateJournalSchema,
  type AddJournalInput,
  type UpdateJournalInput,
} from "./schema";
import * as repo from "@/lib/researcherJournalsRepo";

export async function createJournal(
  formData: unknown
): Promise<{ error?: string; id?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = addJournalSchema.safeParse(formData);
  if (!parsed.success) {
    console.error("createJournal validation error:", parsed.error);
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const data = parsed.data as AddJournalInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.startDate > today) {
    return { error: "تاريخ البداية لا يمكن أن يكون في المستقبل" };
  }
  if (!data.isActive && data.endDate && data.endDate > today) {
    return { error: "تاريخ النهاية لا يمكن أن يكون في المستقبل" };
  }
  if (!data.isActive && !data.endDate) {
    return { error: "تاريخ النهاية مطلوب عند اختيار غير نشط" };
  }
  if (data.endDate && data.startDate && data.endDate < data.startDate) {
    return { error: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" };
  }

  try {
    const row = await repo.createResearcherJournal(session.id, {
      name: data.name,
      role: data.role,
      type: data.type,
      startDate: data.startDate,
      isActive: data.isActive,
      endDate: data.isActive ? null : data.endDate || null,
      impactFactor: data.impactFactor ?? null,
      description: data.description ?? null,
    });
    return { id: row.id };
  } catch (e) {
    console.error("createJournal error:", e);
    return { error: `فشل في إضافة العضوية: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function updateJournal(
  formData: unknown
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = updateJournalSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const { id, ...data } = parsed.data as UpdateJournalInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.startDate > today) {
    return { error: "تاريخ البداية لا يمكن أن يكون في المستقبل" };
  }
  if (!data.isActive && data.endDate && data.endDate > today) {
    return { error: "تاريخ النهاية لا يمكن أن يكون في المستقبل" };
  }
  if (!data.isActive && !data.endDate) {
    return { error: "تاريخ النهاية مطلوب عند اختيار غير نشط" };
  }
  if (data.endDate && data.startDate && data.endDate < data.startDate) {
    return { error: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" };
  }

  try {
    const updated = await repo.updateResearcherJournal(id, session.id, {
      name: data.name,
      role: data.role,
      type: data.type,
      startDate: data.startDate,
      isActive: data.isActive,
      endDate: data.isActive ? null : data.endDate || null,
      impactFactor: data.impactFactor ?? null,
      description: data.description ?? null,
    });
    if (!updated) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("updateJournal error:", e);
    return { error: "فشل في تحديث العضوية" };
  }
}

export async function deleteJournal(id: string): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const deleted = await repo.deleteResearcherJournal(id, session.id);
    if (!deleted) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("deleteJournal", e);
    return { error: "فشل في حذف العضوية" };
  }
}

export async function listJournals(filters?: repo.ResearcherJournalFilters) {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const items = await repo.listResearcherJournals(session.id, filters);
    return { items };
  } catch (e) {
    console.error("listJournals", e);
    return { error: "فشل في جلب القائمة" };
  }
}
