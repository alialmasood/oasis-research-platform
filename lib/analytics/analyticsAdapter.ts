import { prisma } from "@/lib/db";
import type { UnifiedEvent } from "./analyticsTypes";

export async function getUnifiedEvents(userId: string, from: Date, to: Date): Promise<UnifiedEvent[]> {
  const [research, conferences, workshops, committees] = await Promise.all([
    prisma.research.findMany({
      where: { researcherId: userId, createdAt: { gte: from, lte: to } },
      select: { createdAt: true, publisher: true, publishStatus: true, publishMonth: true, year: true, scopusQuartile: true, publishType: true },
    }),
    prisma.researcherConference.findMany({
      where: { researcherId: userId, date: { gte: from, lte: to } },
      select: { date: true, sponsor: true, scope: true },
    }),
    prisma.workshop.findMany({
      where: { researcherId: userId, date: { gte: from, lte: to } },
      select: { date: true, beneficiary: true },
    }),
    prisma.committee.findMany({
      where: { researcherId: userId, assignmentDate: { gte: from, lte: to } },
      select: { assignmentDate: true, title: true },
    }),
  ]);

  const events: UnifiedEvent[] = [];

  research.forEach((item) => {
    const isPublished = item.publishStatus === "PUBLISHED";
    const publishedDate =
      isPublished && item.year && item.publishMonth
        ? new Date(item.year, item.publishMonth - 1, 1)
        : item.createdAt;
    const scope =
      item.scopusQuartile != null
        ? "international"
        : item.publishType === "CONFERENCE"
          ? "regional"
          : "local";
    events.push({
      date: publishedDate,
      type: "research",
      venue: item.publisher ?? "غير محدد",
      published: isPublished,
      scope,
    });
  });

  conferences.forEach((item) => {
    events.push({
      date: item.date,
      type: "conference",
      venue: item.sponsor ?? "غير محدد",
      scope: item.scope === "GLOBAL" ? "international" : "local",
    });
  });

  workshops.forEach((item) => {
    events.push({
      date: item.date,
      type: "workshop",
      venue: item.beneficiary ?? "غير محدد",
    });
  });

  committees.forEach((item) => {
    events.push({
      date: item.assignmentDate,
      type: "committee",
      venue: item.title ?? "غير محدد",
    });
  });

  return events;
}
