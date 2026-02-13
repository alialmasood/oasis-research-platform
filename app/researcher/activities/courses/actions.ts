"use server";

import { getSessionUser } from "@/lib/middleware";
import {
  addCourseSchema,
  updateCourseSchema,
  type AddCourseInput,
  type UpdateCourseInput,
} from "./schema";
import * as repo from "@/lib/researcherCoursesRepo";

export async function createCourse(
  formData: unknown
): Promise<{ error?: string; id?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = addCourseSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const data = parsed.data as AddCourseInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.date > today) {
    return { error: "التاريخ لا يمكن أن يكون في المستقبل" };
  }

  try {
    const row = await repo.createResearcherCourse(session.id, {
      title: data.title,
      date: data.date,
      beneficiary: data.beneficiary,
      location: data.location,
      participationType: data.participationType,
      description: data.description || null,
    });
    return { id: row.id };
  } catch (e) {
    console.error("createCourse error:", e);
    return { error: "فشل في إضافة الدورة" };
  }
}

export async function updateCourse(
  formData: unknown
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = updateCourseSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const { id, ...data } = parsed.data as UpdateCourseInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.date > today) {
    return { error: "التاريخ لا يمكن أن يكون في المستقبل" };
  }

  try {
    const updated = await repo.updateResearcherCourse(id, session.id, {
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
    console.error("updateCourse error:", e);
    return { error: "فشل في تحديث الدورة" };
  }
}

export async function deleteCourse(id: string): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const deleted = await repo.deleteResearcherCourse(id, session.id);
    if (!deleted) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("deleteCourse", e);
    return { error: "فشل في حذف الدورة" };
  }
}

export async function listCourses(filters?: repo.ResearcherCourseFilters) {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const items = await repo.listResearcherCourses(session.id, filters);
    return { items };
  } catch (e) {
    console.error("listCourses", e);
    return { error: "فشل في جلب القائمة" };
  }
}
