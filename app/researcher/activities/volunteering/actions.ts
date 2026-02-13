"use server";

import { getSessionUser } from "@/lib/middleware";
import {
  addVolunteeringSchema,
  updateVolunteeringSchema,
  type AddVolunteeringInput,
  type UpdateVolunteeringInput,
} from "./schema";
import * as repo from "@/lib/researcherVolunteeringRepo";

export async function createVolunteering(
  formData: unknown
): Promise<{ error?: string; id?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = addVolunteeringSchema.safeParse(formData);
  if (!parsed.success) {
    console.error("createVolunteering validation error:", parsed.error);
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const data = parsed.data as AddVolunteeringInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.startDate > today) {
    return { error: "تاريخ البداية لا يمكن أن يكون في المستقبل" };
  }
  if (!data.isOngoing && data.endDate && data.endDate > today) {
    return { error: "تاريخ النهاية لا يمكن أن يكون في المستقبل" };
  }
  if (!data.isOngoing && !data.endDate) {
    return { error: "تاريخ النهاية مطلوب عند اختيار غير مستمر" };
  }
  if (data.isOngoing && data.endDate) {
    return { error: "تاريخ النهاية غير مسموح عند اختيار مستمر" };
  }
  if (data.endDate && data.startDate && data.endDate < data.startDate) {
    return { error: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" };
  }
  // التحقق من المدة فقط إذا كان العمل غير مستمر
  if (!data.isOngoing && data.durationYears === 0 && data.durationMonths === 0 && data.durationDays === 0) {
    return { error: "يجب تحديد المدة (سنة أو شهر أو يوم) عند اختيار غير مستمر" };
  }

  try {
    const row = await repo.createResearcherVolunteering(session.id, {
      title: data.title,
      type: data.type,
      role: data.role,
      organizationName: data.organizationName,
      startDate: data.startDate,
      endDate: data.isOngoing ? null : (data.endDate || null),
      isOngoing: data.isOngoing,
      durationYears: data.durationYears,
      durationMonths: data.durationMonths,
      durationDays: data.durationDays,
      durationUnit: data.durationUnit,
      location: data.location ?? null,
      beneficiaries: data.beneficiaries ?? null,
      certificates: data.certificates ?? null,
      description: data.description ?? null,
    });
    return { id: row.id };
  } catch (e) {
    console.error("createVolunteering error:", e);
    return { error: `فشل في إضافة العمل الطوعي: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function updateVolunteering(
  formData: unknown
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = updateVolunteeringSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const { id, ...data } = parsed.data as UpdateVolunteeringInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.startDate > today) {
    return { error: "تاريخ البداية لا يمكن أن يكون في المستقبل" };
  }
  if (!data.isOngoing && data.endDate && data.endDate > today) {
    return { error: "تاريخ النهاية لا يمكن أن يكون في المستقبل" };
  }
  if (!data.isOngoing && !data.endDate) {
    return { error: "تاريخ النهاية مطلوب عند اختيار غير مستمر" };
  }
  if (data.isOngoing && data.endDate) {
    return { error: "تاريخ النهاية غير مسموح عند اختيار مستمر" };
  }
  if (data.endDate && data.startDate && data.endDate < data.startDate) {
    return { error: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" };
  }
  // التحقق من المدة فقط إذا كان العمل غير مستمر
  if (!data.isOngoing && data.durationYears === 0 && data.durationMonths === 0 && data.durationDays === 0) {
    return { error: "يجب تحديد المدة (سنة أو شهر أو يوم) عند اختيار غير مستمر" };
  }

  try {
    const updated = await repo.updateResearcherVolunteering(id, session.id, {
      title: data.title,
      type: data.type,
      role: data.role,
      organizationName: data.organizationName,
      startDate: data.startDate,
      endDate: data.isOngoing ? null : (data.endDate || null),
      isOngoing: data.isOngoing,
      durationYears: data.durationYears,
      durationMonths: data.durationMonths,
      durationDays: data.durationDays,
      durationUnit: data.durationUnit,
      location: data.location ?? null,
      beneficiaries: data.beneficiaries ?? null,
      certificates: data.certificates ?? null,
      description: data.description ?? null,
    });
    if (!updated) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("updateVolunteering error:", e);
    return { error: "فشل في تحديث العمل الطوعي" };
  }
}

export async function deleteVolunteering(id: string): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const deleted = await repo.deleteResearcherVolunteering(id, session.id);
    if (!deleted) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("deleteVolunteering", e);
    return { error: "فشل في حذف العمل الطوعي" };
  }
}

export async function listVolunteerings(filters?: repo.ResearcherVolunteeringFilters) {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const items = await repo.listResearcherVolunteerings(session.id, filters);
    return { items };
  } catch (e) {
    console.error("listVolunteerings", e);
    return { error: "فشل في جلب القائمة" };
  }
}
