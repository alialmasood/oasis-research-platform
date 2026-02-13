import { prisma } from "@/lib/db";

function getDelegate() {
  const d = (prisma as any).form21Submission;
  if (!d?.findMany) throw new Error("Prisma client لا يتضمن Form21Submission. نفّذ: npx prisma generate");
  return d;
}

export type Form21SubmissionCreate = {
  researcherId: string;
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
  formData?: Record<string, unknown>;
};

export async function createForm21Submission(data: Form21SubmissionCreate) {
  return getDelegate().create({
    data: {
      researcherId: data.researcherId,
      year: data.year,
      axis1Raw: data.axis1Raw,
      axis2Raw: data.axis2Raw,
      axis3Raw: data.axis3Raw,
      axis1Weighted: data.axis1Weighted,
      axis2Weighted: data.axis2Weighted,
      axis3Weighted: data.axis3Weighted,
      strengthScore: data.strengthScore,
      penaltyScore: data.penaltyScore,
      finalScore: data.finalScore,
      finalGrade: data.finalGrade,
      formData: data.formData ?? undefined,
    },
  });
}

export async function getLastForm21Submission(researcherId: string) {
  return getDelegate().findFirst({
    where: { researcherId },
    orderBy: { updatedAt: "desc" },
  });
}
