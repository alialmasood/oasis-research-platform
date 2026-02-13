"use server";

import { getSessionUser } from "@/lib/middleware";
import {
  addCertificateSchema,
  updateCertificateSchema,
  type AddCertificateInput,
  type UpdateCertificateInput,
} from "./schema";
import * as repo from "@/lib/researcherCertificatesRepo";

export async function createCertificate(
  formData: unknown
): Promise<{ error?: string; id?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = addCertificateSchema.safeParse(formData);
  if (!parsed.success) {
    console.error("createCertificate validation error:", parsed.error);
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const data = parsed.data as AddCertificateInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.date > today) {
    return { error: "التاريخ لا يمكن أن يكون في المستقبل" };
  }

  try {
    const row = await repo.createResearcherCertificate(session.id, {
      title: data.title,
      issuingOrganization: data.issuingOrganization,
      date: data.date,
      description: data.description ?? null,
    });
    return { id: row.id };
  } catch (e) {
    console.error("createCertificate error:", e);
    return { error: `فشل في إضافة الشهادة: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function updateCertificate(
  formData: unknown
): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  const parsed = updateCertificateSchema.safeParse(formData);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? parsed.error.message;
    return { error: String(msg) };
  }

  const { id, ...data } = parsed.data as UpdateCertificateInput;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (data.date > today) {
    return { error: "التاريخ لا يمكن أن يكون في المستقبل" };
  }

  try {
    const updated = await repo.updateResearcherCertificate(id, session.id, {
      title: data.title,
      issuingOrganization: data.issuingOrganization,
      date: data.date,
      description: data.description ?? null,
    });
    if (!updated) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("updateCertificate error:", e);
    return { error: "فشل في تحديث الشهادة" };
  }
}

export async function deleteCertificate(id: string): Promise<{ error?: string }> {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const deleted = await repo.deleteResearcherCertificate(id, session.id);
    if (!deleted) return { error: "السجل غير موجود أو لا يخصك" };
    return {};
  } catch (e) {
    console.error("deleteCertificate", e);
    return { error: "فشل في حذف الشهادة" };
  }
}

export async function listCertificates(filters?: repo.ResearcherCertificateFilters) {
  const session = await getSessionUser();
  if (!session) return { error: "غير مصرح" };

  try {
    const items = await repo.listResearcherCertificates(session.id, filters);
    return { items };
  } catch (e) {
    console.error("listCertificates", e);
    return { error: "فشل في جلب القائمة" };
  }
}
