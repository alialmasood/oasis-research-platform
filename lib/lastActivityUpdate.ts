import { prisma } from "@/lib/db";

/**
 * يرجع تاريخ آخر تحديث لأي نشاط للباحث (بحوث، مؤتمرات، إلخ)
 */
export async function getLastActivityUpdate(researcherId: string): Promise<Date | null> {
  const queries = [
    prisma.research.findFirst({ where: { researcherId }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    prisma.researcherConference.findFirst({ where: { researcherId }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    prisma.journal.findFirst({ where: { researcherId }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    prisma.reviewing.findFirst({ where: { researcherId }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    prisma.supervision.findFirst({ where: { researcherId }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    prisma.course.findFirst({ where: { researcherId }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    prisma.seminar.findFirst({ where: { researcherId }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    prisma.workshop.findFirst({ where: { researcherId }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    prisma.assignment.findFirst({ where: { researcherId }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    prisma.thankYouLetter.findFirst({ where: { researcherId }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    prisma.committee.findFirst({ where: { researcherId }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    prisma.certificate.findFirst({ where: { researcherId }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    prisma.volunteering.findFirst({ where: { researcherId }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    prisma.fieldVisit.findFirst({ where: { researcherId }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    prisma.position.findFirst({ where: { researcherId }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
  ];

  const results = await Promise.all(queries);
  const dates = results
    .map((r) => r?.updatedAt)
    .filter((d): d is Date => d != null);

  return dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;
}

/**
 * تنسيق "منذ X" للعرض
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays === 1) return "منذ يوم";
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
  if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} شهر`;
  return `منذ ${Math.floor(diffDays / 365)} سنة`;
}
