import { prisma } from "@/lib/db";

export type TimelineActivity = {
  id: string;
  type: string;
  title: string;
  date: string;
  status: "completed" | "published" | "planned";
};

const MAX_ITEMS = 20;

function toIso(d: Date) {
  return new Date(d).toISOString();
}

export async function getRecentActivities(userId: string): Promise<TimelineActivity[]> {
  const [
    research,
    conferences,
    seminars,
    courses,
    workshops,
    assignments,
    thankYouLetters,
    committees,
    certificates,
    journals,
    supervision,
    reviewing,
    positions,
    volunteering,
    fieldVisits,
  ] = await Promise.all([
    prisma.research.findMany({
      where: { researcherId: userId },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { id: true, title: true, status: true, publishStatus: true, createdAt: true },
    }),
    prisma.researcherConference.findMany({
      where: { researcherId: userId },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { id: true, title: true, date: true, createdAt: true },
    }),
    prisma.seminar.findMany({
      where: { researcherId: userId },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { id: true, title: true, date: true, createdAt: true },
    }),
    prisma.course.findMany({
      where: { researcherId: userId },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { id: true, title: true, date: true, createdAt: true },
    }),
    prisma.workshop.findMany({
      where: { researcherId: userId },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { id: true, title: true, date: true, createdAt: true },
    }),
    prisma.assignment.findMany({
      where: { researcherId: userId },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { id: true, title: true, assignmentDate: true, status: true, createdAt: true },
    }),
    prisma.thankYouLetter.findMany({
      where: { researcherId: userId },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { id: true, issuingOrganization: true, date: true, createdAt: true },
    }),
    prisma.committee.findMany({
      where: { researcherId: userId },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { id: true, title: true, assignmentDate: true, createdAt: true },
    }),
    prisma.certificate.findMany({
      where: { researcherId: userId },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { id: true, title: true, date: true, createdAt: true },
    }),
    prisma.journal.findMany({
      where: { researcherId: userId },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { id: true, name: true, startDate: true, createdAt: true },
    }),
    prisma.supervision.findMany({
      where: { researcherId: userId },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { id: true, studentName: true, startDate: true, createdAt: true },
    }),
    prisma.reviewing.findMany({
      where: { researcherId: userId },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { id: true, title: true, date: true, createdAt: true },
    }),
    prisma.position.findMany({
      where: { researcherId: userId },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { id: true, title: true, positionDate: true, createdAt: true },
    }),
    prisma.volunteering.findMany({
      where: { researcherId: userId },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { id: true, title: true, startDate: true, createdAt: true },
    }),
    prisma.fieldVisit.findMany({
      where: { researcherId: userId },
      orderBy: { createdAt: "desc" },
      take: MAX_ITEMS,
      select: { id: true, title: true, activityDate: true, createdAt: true },
    }),
  ]);

  const items = [
    ...research.map((r) => ({
      id: r.id,
      type: r.publishStatus === "PUBLISHED" ? "publication" : "research",
      title: r.title,
      date: toIso(r.createdAt),
      sortDate: toIso(r.createdAt),
      status:
        r.publishStatus === "PUBLISHED"
          ? "published"
          : r.status === "IN_PROGRESS"
            ? "planned"
            : "completed",
    })),
    ...conferences.map((c) => ({
      id: c.id,
      type: "conference",
      title: c.title,
      date: toIso(c.date),
      sortDate: toIso(c.createdAt),
      status: "completed",
    })),
    ...seminars.map((s) => ({
      id: s.id,
      type: "seminar",
      title: s.title,
      date: toIso(s.date),
      sortDate: toIso(s.createdAt),
      status: "completed",
    })),
    ...courses.map((c) => ({
      id: c.id,
      type: "course",
      title: c.title,
      date: toIso(c.date),
      sortDate: toIso(c.createdAt),
      status: "completed",
    })),
    ...workshops.map((w) => ({
      id: w.id,
      type: "workshop",
      title: w.title,
      date: toIso(w.date),
      sortDate: toIso(w.createdAt),
      status: "completed",
    })),
    ...assignments.map((a) => ({
      id: a.id,
      type: "assignment",
      title: a.title,
      date: toIso(a.assignmentDate),
      sortDate: toIso(a.createdAt),
      status: a.status === "COMPLETED" ? "completed" : "planned",
    })),
    ...thankYouLetters.map((t) => ({
      id: t.id,
      type: "thankYou",
      title: `كتاب شكر: ${t.issuingOrganization}`,
      date: toIso(t.date),
      sortDate: toIso(t.createdAt),
      status: "completed",
    })),
    ...committees.map((c) => ({
      id: c.id,
      type: "committee",
      title: c.title,
      date: toIso(c.assignmentDate),
      sortDate: toIso(c.createdAt),
      status: "completed",
    })),
    ...certificates.map((c) => ({
      id: c.id,
      type: "certificate",
      title: c.title,
      date: toIso(c.date),
      sortDate: toIso(c.createdAt),
      status: "completed",
    })),
    ...journals.map((j) => ({
      id: j.id,
      type: "journal",
      title: j.name,
      date: toIso(j.startDate),
      sortDate: toIso(j.createdAt),
      status: "completed",
    })),
    ...supervision.map((s) => ({
      id: s.id,
      type: "supervision",
      title: `إشراف: ${s.studentName}`,
      date: toIso(s.startDate),
      sortDate: toIso(s.createdAt),
      status: "completed",
    })),
    ...reviewing.map((r) => ({
      id: r.id,
      type: "reviewing",
      title: r.title,
      date: toIso(r.date),
      sortDate: toIso(r.createdAt),
      status: "completed",
    })),
    ...positions.map((p) => ({
      id: p.id,
      type: "position",
      title: p.title,
      date: toIso(p.positionDate),
      sortDate: toIso(p.createdAt),
      status: "completed",
    })),
    ...volunteering.map((v) => ({
      id: v.id,
      type: "volunteering",
      title: v.title,
      date: toIso(v.startDate),
      sortDate: toIso(v.createdAt),
      status: "completed",
    })),
    ...fieldVisits.map((f) => ({
      id: f.id,
      type: "fieldVisit",
      title: f.title,
      date: toIso(f.activityDate),
      sortDate: toIso(f.createdAt),
      status: "completed",
    })),
  ] as Array<TimelineActivity & { sortDate: string }>;

  return items
    .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
    .slice(0, MAX_ITEMS)
    .map(({ sortDate, ...rest }) => rest);
}
