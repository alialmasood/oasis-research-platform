import { prisma } from "@/lib/db";

export type ResearcherActivityCounts = {
  research: number;
  conferences: number;
  positions: number;
  seminars: number;
  courses: number;
  workshops: number;
  assignments: number;
  thanks: number;
  committees: number;
  certificates: number;
  journals: number;
  supervision: number;
  reviewing: number;
  volunteering: number;
  fieldVisits: number;
};

export async function getResearcherActivityCounts(
  researcherId: string
): Promise<ResearcherActivityCounts> {
  const [
    research,
    conferences,
    positions,
    seminars,
    courses,
    workshops,
    assignments,
    thanks,
    committees,
    certificates,
    journals,
    supervision,
    reviewing,
    volunteering,
    fieldVisits,
  ] = await Promise.all([
    prisma.research.count({ where: { researcherId } }),
    prisma.researcherConference.count({ where: { researcherId } }),
    prisma.position.count({ where: { researcherId } }),
    prisma.seminar.count({ where: { researcherId } }),
    prisma.course.count({ where: { researcherId } }),
    prisma.workshop.count({ where: { researcherId } }),
    prisma.assignment.count({ where: { researcherId } }),
    prisma.thankYouLetter.count({ where: { researcherId } }),
    prisma.committee.count({ where: { researcherId } }),
    prisma.certificate.count({ where: { researcherId } }),
    prisma.journal.count({ where: { researcherId } }),
    prisma.supervision.count({ where: { researcherId } }),
    prisma.reviewing.count({ where: { researcherId } }),
    prisma.volunteering.count({ where: { researcherId } }),
    prisma.fieldVisit.count({ where: { researcherId } }),
  ]);

  return {
    research,
    conferences,
    positions,
    seminars,
    courses,
    workshops,
    assignments,
    thanks,
    committees,
    certificates,
    journals,
    supervision,
    reviewing,
    volunteering,
    fieldVisits,
  };
}
