import { prisma } from "@/lib/db";

export type GoalsInput = {
  research?: number;
  conferences?: number;
  seminars?: number;
  workshops?: number;
  courses?: number;
  assignments?: number;
  thankYouLetters?: number;
  committees?: number;
  certificates?: number;
  journals?: number;
  supervision?: number;
  reviewing?: number;
  positions?: number;
  volunteering?: number;
  fieldVisits?: number;
};

const DEFAULT_GOALS: GoalsInput = {
  research: 0,
  conferences: 0,
  seminars: 0,
  workshops: 0,
  courses: 0,
  assignments: 0,
  thankYouLetters: 0,
  committees: 0,
  certificates: 0,
  journals: 0,
  supervision: 0,
  reviewing: 0,
  positions: 0,
  volunteering: 0,
  fieldVisits: 0,
};

export async function getGoals(userId: string, year: number) {
  const row = await prisma.researcherGoals.findUnique({
    where: { userId_year: { userId, year } },
  });
  if (!row || !row.goals || typeof row.goals !== "object") return { ...DEFAULT_GOALS };
  return { ...DEFAULT_GOALS, ...(row.goals as GoalsInput) };
}

export async function setGoals(userId: string, year: number, goals: GoalsInput) {
  const payload = { ...DEFAULT_GOALS, ...goals };
  await prisma.researcherGoals.upsert({
    where: { userId_year: { userId, year } },
    create: { userId, year, goals: payload },
    update: { goals: payload },
  });
}
