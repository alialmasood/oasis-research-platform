"use server";

import { getSessionUser } from "@/lib/middleware";
import {
  addAssignmentSchema,
  updateAssignmentSchema,
  type AddAssignmentInput,
  type UpdateAssignmentInput,
} from "./schema";
import * as repo from "@/lib/researcherAssignmentsRepo";

export async function createAssignment(
  formData: unknown
): Promise<{ error?: string; id?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = addAssignmentSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const data = parsed.data as AddAssignmentInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.assignmentDate > today) {
    return { error: "تاريخ التكليف لا يمكن أن يكون في المستقبل" };
  }

  if (data.status === "COMPLETED" && (!data.completionDate || data.completionDate > today)) {
    return { error: "إذا كان التكليف منتهي، يجب إدخال تاريخ انتهاء صحيح (لا يكون في المستقبل)" };
  }

  if (data.completionDate && data.assignmentDate && data.completionDate < data.assignmentDate) {
    return { error: "تاريخ الانتهاء يجب أن يكون بعد تاريخ التكليف" };
  }

  try {
    const row = await repo.createResearcherAssignment(session.id, {
      title: data.title,
      assignmentDate: data.assignmentDate,
      status: data.status,
      completionDate: data.status === "COMPLETED" ? data.completionDate : null,
      description: data.description || null,
    });
    return { id: row.id };
  } catch (e) {
    console.error("createAssignment error:", e);
    return { error: "فشل في إضافة التكليف" };
  }
}

export async function updateAssignment(
  formData: unknown
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = updateAssignmentSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const { id, ...data } = parsed.data as UpdateAssignmentInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.assignmentDate && data.assignmentDate > today) {
    return { error: "تاريخ التكليف لا يمكن أن يكون في المستقبل" };
  }

  if (data.status === "COMPLETED" && (!data.completionDate || data.completionDate > today)) {
    return { error: "إذا كان التكليف منتهي، يجب إدخال تاريخ انتهاء صحيح (لا يكون في المستقبل)" };
  }

  if (data.completionDate && data.assignmentDate && data.completionDate < data.assignmentDate) {
    return { error: "تاريخ الانتهاء يجب أن يكون بعد تاريخ التكليف" };
  }

  try {
    const updated = await repo.updateResearcherAssignment(id, session.id, {
      title: data.title,
      assignmentDate: data.assignmentDate,
      status: data.status,
      completionDate: data.status === "COMPLETED" ? data.completionDate : null,
      description: data.description || null,
    });
    if (!updated) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("updateAssignment error:", e);
    return { error: "فشل في تحديث التكليف" };
  }
}

export async function deleteAssignment(id: string): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const deleted = await repo.deleteResearcherAssignment(id, session.id);
    if (!deleted) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("deleteAssignment", e);
    return { error: "فشل في حذف التكليف" };
  }
}

export async function listAssignments(filters?: repo.ResearcherAssignmentFilters) {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const items = await repo.listResearcherAssignments(session.id, filters);
    return { items };
  } catch (e) {
    console.error("listAssignments", e);
    return { error: "فشل في جلب القائمة" };
  }
}
