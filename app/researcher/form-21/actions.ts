"use server";

import { getSessionUser } from "@/lib/middleware";
import * as repo from "@/lib/form21Repo";

export async function getLastForm21Submission() {
  const user = await getSessionUser();
  if (!user) return { error: "غير مصرح" };
  try {
    const row = await repo.getLastForm21Submission(user.id);
    return { data: row };
  } catch (e) {
    console.error("getLastForm21Submission", e);
    return { error: "فشل جلب البيانات" };
  }
}

export async function saveForm21Submission(payload: {
  year: string;
  axis1Raw: number;
  axis2Raw: number;
  axis3Raw: number;
  axis1Weighted: number;
  axis2Weighted: number;
  axis3Weighted: number;
  strengthScore: number;
  penaltyScore: number;
  finalScore: number;
  finalGrade: string;
  formData: Record<string, unknown>;
}) {
  const user = await getSessionUser();
  if (!user) return { error: "غير مصرح" };
  try {
    await repo.createForm21Submission({
      researcherId: user.id,
      year: payload.year,
      axis1Raw: payload.axis1Raw,
      axis2Raw: payload.axis2Raw,
      axis3Raw: payload.axis3Raw,
      axis1Weighted: payload.axis1Weighted,
      axis2Weighted: payload.axis2Weighted,
      axis3Weighted: payload.axis3Weighted,
      strengthScore: payload.strengthScore,
      penaltyScore: payload.penaltyScore,
      finalScore: payload.finalScore,
      finalGrade: payload.finalGrade,
      formData: payload.formData,
    });
    return {};
  } catch (e) {
    console.error("saveForm21Submission", e);
    return { error: "فشل الحفظ" };
  }
}
