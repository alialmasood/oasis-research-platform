"use server";

import { getSessionUser } from "@/lib/middleware";
import {
  addSupervisionSchema,
  updateSupervisionSchema,
  type AddSupervisionInput,
  type UpdateSupervisionInput,
} from "./schema";
import * as repo from "@/lib/researcherSupervisionRepo";

export async function createSupervision(
  formData: unknown
): Promise<{ error?: string; id?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = addSupervisionSchema.safeParse(formData);
  if (!parsed.success) {
    console.error("createSupervision validation error:", parsed.error);
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const data = parsed.data as AddSupervisionInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.startDate > today) {
    return { error: "تاريخ البداية لا يمكن أن يكون في المستقبل" };
  }
  if (data.status === "COMPLETED" && data.endDate && data.endDate > today) {
    return { error: "تاريخ الانتهاء لا يمكن أن يكون في المستقبل" };
  }
  if (data.status === "COMPLETED" && !data.endDate) {
    return { error: "تاريخ الانتهاء مطلوب عند اختيار مكتمل" };
  }
  if (data.status === "IN_PROGRESS" && data.endDate) {
    return { error: "تاريخ الانتهاء غير مسموح عند اختيار غير مكتمل" };
  }
  if (data.endDate && data.startDate && data.endDate < data.startDate) {
    return { error: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية" };
  }
  if ((data.degreeType === "PHD" || data.degreeType === "MASTERS") && !data.supervisionType) {
    return { error: "نوع الإشراف مطلوب لدكتوراه وماجستير" };
  }
  if ((data.degreeType === "BACHELORS" || data.degreeType === "HIGHER_DIPLOMA") && data.supervisionType) {
    return { error: "نوع الإشراف غير مسموح لبكالوريوس ودبلوم عالي" };
  }

  try {
    const row = await repo.createResearcherSupervision(session.id, {
      studentName: data.studentName,
      degreeType: data.degreeType,
      thesisTitle: data.thesisTitle,
      startDate: data.startDate,
      endDate: data.status === "COMPLETED" ? (data.endDate || null) : null,
      status: data.status,
      supervisionType: (data.degreeType === "PHD" || data.degreeType === "MASTERS") ? (data.supervisionType || null) : null,
      description: data.description ?? null,
    });
    return { id: row.id };
  } catch (e) {
    console.error("createSupervision error:", e);
    return { error: `فشل في إضافة الإشراف: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function updateSupervision(
  formData: unknown
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = updateSupervisionSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const { id, ...data } = parsed.data as UpdateSupervisionInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.startDate > today) {
    return { error: "تاريخ البداية لا يمكن أن يكون في المستقبل" };
  }
  if (data.status === "COMPLETED" && data.endDate && data.endDate > today) {
    return { error: "تاريخ الانتهاء لا يمكن أن يكون في المستقبل" };
  }
  if (data.status === "COMPLETED" && !data.endDate) {
    return { error: "تاريخ الانتهاء مطلوب عند اختيار مكتمل" };
  }
  if (data.status === "IN_PROGRESS" && data.endDate) {
    return { error: "تاريخ الانتهاء غير مسموح عند اختيار غير مكتمل" };
  }
  if (data.endDate && data.startDate && data.endDate < data.startDate) {
    return { error: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية" };
  }
  if ((data.degreeType === "PHD" || data.degreeType === "MASTERS") && !data.supervisionType) {
    return { error: "نوع الإشراف مطلوب لدكتوراه وماجستير" };
  }
  if ((data.degreeType === "BACHELORS" || data.degreeType === "HIGHER_DIPLOMA") && data.supervisionType) {
    return { error: "نوع الإشراف غير مسموح لبكالوريوس ودبلوم عالي" };
  }

  try {
    const updated = await repo.updateResearcherSupervision(id, session.id, {
      studentName: data.studentName,
      degreeType: data.degreeType,
      thesisTitle: data.thesisTitle,
      startDate: data.startDate,
      endDate: data.status === "COMPLETED" ? (data.endDate || null) : null,
      status: data.status,
      supervisionType: (data.degreeType === "PHD" || data.degreeType === "MASTERS") ? (data.supervisionType || null) : null,
      description: data.description ?? null,
    });
    if (!updated) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("updateSupervision error:", e);
    return { error: "فشل في تحديث الإشراف" };
  }
}

export async function deleteSupervision(id: string): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const deleted = await repo.deleteResearcherSupervision(id, session.id);
    if (!deleted) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("deleteSupervision", e);
    return { error: "فشل في حذف الإشراف" };
  }
}

export async function listSupervisions(filters?: repo.ResearcherSupervisionFilters) {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const items = await repo.listResearcherSupervisions(session.id, filters);
    return { items };
  } catch (e) {
    console.error("listSupervisions", e);
    return { error: "فشل في جلب القائمة" };
  }
}
