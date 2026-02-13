"use server";

import { getSessionUser } from "@/lib/middleware";
import {
  addCommitteeSchema,
  updateCommitteeSchema,
  type AddCommitteeInput,
  type UpdateCommitteeInput,
} from "./schema";
import * as repo from "@/lib/researcherCommitteesRepo";

export async function createCommittee(
  formData: unknown
): Promise<{ error?: string; id?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = addCommitteeSchema.safeParse(formData);
  if (!parsed.success) {
    console.error("createCommittee validation error:", parsed.error);
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const data = parsed.data as AddCommitteeInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.assignmentDate > today) {
    return { error: "تاريخ التكليف لا يمكن أن يكون في المستقبل" };
  }

  try {
    const row = await repo.createResearcherCommittee(session.id, {
      title: data.title,
      assignmentDate: data.assignmentDate,
      role: data.role,
      description: data.description ?? null,
    });
    return { id: row.id };
  } catch (e) {
    console.error("createCommittee error:", e);
    return { error: `فشل في إضافة اللجنة: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function updateCommittee(
  formData: unknown
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = updateCommitteeSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const { id, ...data } = parsed.data as UpdateCommitteeInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.assignmentDate > today) {
    return { error: "تاريخ التكليف لا يمكن أن يكون في المستقبل" };
  }

  try {
    const updated = await repo.updateResearcherCommittee(id, session.id, {
      title: data.title,
      assignmentDate: data.assignmentDate,
      role: data.role,
      description: data.description ?? null,
    });
    if (!updated) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("updateCommittee error:", e);
    return { error: "فشل في تحديث اللجنة" };
  }
}

export async function deleteCommittee(id: string): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const deleted = await repo.deleteResearcherCommittee(id, session.id);
    if (!deleted) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("deleteCommittee", e);
    return { error: "فشل في حذف اللجنة" };
  }
}

export async function listCommittees(filters?: repo.ResearcherCommitteeFilters) {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const items = await repo.listResearcherCommittees(session.id, filters);
    return { items };
  } catch (e) {
    console.error("listCommittees", e);
    return { error: "فشل في جلب القائمة" };
  }
}
