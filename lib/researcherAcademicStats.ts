import { getAggregatedCounts, type EvaluationPeriod } from "@/lib/evaluationAggregate";

export type AcademicActivityStats = {
  conferences: number;
  seminars: number;
  courses: number;
  workshops: number;
  assignments: number;
  thankYouBooks: number;
  committees: number;
  participationCertificates: number;
  journalManagement: number;
  studentSupervision: number;
  positions: number;
  scientificCalendar: number;
  volunteerWork: number;
  fieldVisits: number;
};

export function emptyAcademicActivityStats(): AcademicActivityStats {
  return {
    conferences: 0,
    seminars: 0,
    courses: 0,
    workshops: 0,
    assignments: 0,
    thankYouBooks: 0,
    committees: 0,
    participationCertificates: 0,
    journalManagement: 0,
    studentSupervision: 0,
    positions: 0,
    scientificCalendar: 0,
    volunteerWork: 0,
    fieldVisits: 0,
  };
}

export async function getAcademicActivityStats(
  researcherId: string,
  period?: EvaluationPeriod
): Promise<AcademicActivityStats> {
  const aggregates = await getAggregatedCounts(researcherId, period);
  return {
    conferences: aggregates.conferences,
    seminars: aggregates.seminars,
    courses: aggregates.courses,
    workshops: aggregates.workshops,
    assignments: aggregates.assignments,
    thankYouBooks: aggregates.thankYouLetters,
    committees: aggregates.committees,
    participationCertificates: aggregates.certificates,
    journalManagement: aggregates.journals,
    studentSupervision: aggregates.supervision,
    positions: aggregates.positions,
    scientificCalendar: aggregates.reviewing,
    volunteerWork: aggregates.volunteering,
    fieldVisits: aggregates.fieldVisits,
  };
}
