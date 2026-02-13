"use server";

import { getSessionUser } from "@/lib/middleware";
import { addConferenceSchema, updateConferenceSchema, type AddConferenceInput, type UpdateConferenceInput } from "./schema";
import * as repo from "@/lib/researcherConferencesRepo";

export async function addConference(formData: unknown): Promise<{ error?: string; id?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = addConferenceSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const data = parsed.data as AddConferenceInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.date > today) {
    return { error: "التاريخ لا يمكن أن يكون في المستقبل" };
  }

  try {
    const row = await repo.createResearcherConference(session.id, {
      title: data.title,
      sponsor: data.sponsor,
      date: data.date,
      location: data.location,
      scope: data.scope,
      isCommitteeMember: data.isCommitteeMember,
      participationType: data.participationType,
    });
    return { id: row.id };
  } catch (e) {
    console.error("addConference error:", e);
    return { error: "فشل في إضافة المؤتمر" };
  }
}

export async function updateConference(formData: unknown): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = updateConferenceSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const { id, ...data } = parsed.data as UpdateConferenceInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.date > today) {
    return { error: "التاريخ لا يمكن أن يكون في المستقبل" };
  }

  try {
    const updated = await repo.updateResearcherConference(id, session.id, {
      title: data.title,
      sponsor: data.sponsor,
      date: data.date,
      location: data.location,
      scope: data.scope,
      isCommitteeMember: data.isCommitteeMember,
      participationType: data.participationType,
    });
    if (!updated) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("updateConference error:", e);
    return { error: "فشل في تحديث المؤتمر" };
  }
}

export async function removeConference(id: string): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const deleted = await repo.deleteResearcherConference(id, session.id);
    if (!deleted) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("removeConference", e);
    return { error: "فشل في حذف المؤتمر" };
  }
}

export async function listConferences(filters?: repo.ResearcherConferenceFilters) {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const items = await repo.listResearcherConferences(session.id, filters);
    return { items };
  } catch (e) {
    console.error("listConferences", e);
    return { error: "فشل في جلب القائمة" };
  }
}
