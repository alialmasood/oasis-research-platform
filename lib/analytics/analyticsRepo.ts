import { subMonths } from "date-fns";
import { buildBuckets } from "@/lib/utils/dateBuckets";
import { safePercentChange } from "@/lib/utils/number";
import { getUnifiedEvents } from "./analyticsAdapter";
import { prisma } from "@/lib/db";
import type {
  AnalyticsComparison,
  AnalyticsFilters,
  AnalyticsConferences,
  AnalyticsHeatmapCell,
  AnalyticsKpis,
  AnalyticsPayload,
  AnalyticsPerformance,
  AnalyticsPublications,
  AnalyticsTimelinePoint,
} from "./analyticsTypes";

function initTimelinePoint(label: string, key: string): AnalyticsTimelinePoint {
  return {
    key,
    label,
    total: 0,
    research: 0,
    researchPublished: 0,
    conference: 0,
    workshop: 0,
    committee: 0,
    activitiesCore: 0,
  };
}

function buildTimeline(events: ReturnType<typeof getUnifiedEvents> extends Promise<infer T> ? T : never, filters: AnalyticsFilters) {
  const buckets = buildBuckets(filters.from, filters.to, filters.granularity);
  const timelineMap = new Map<string, AnalyticsTimelinePoint>();
  buckets.forEach((bucket) => {
    timelineMap.set(bucket.key, initTimelinePoint(bucket.label, bucket.key));
  });

  events.forEach((event) => {
    const bucket = buckets.find((b) => event.date >= b.start && event.date <= b.end);
    if (!bucket) return;
    const point = timelineMap.get(bucket.key);
    if (!point) return;
    point.total += 1;
    point[event.type] += 1;
    if (event.type === "research" && event.published) {
      point.researchPublished += 1;
    }
  });

  return buckets
    .map((bucket) => {
      const point = timelineMap.get(bucket.key)!;
      point.activitiesCore = point.research + point.conference + point.workshop;
      return point;
    })
    .filter(Boolean);
}

function buildHeatmap(events: ReturnType<typeof getUnifiedEvents> extends Promise<infer T> ? T : never, to: Date): AnalyticsHeatmapCell[] {
  const start = subMonths(to, 23);
  const buckets = buildBuckets(start, to, "month");
  return buckets.map((bucket) => {
    const value = events.filter((event) => event.date >= bucket.start && event.date <= bucket.end).length;
    return {
      key: bucket.key,
      label: bucket.label,
      value,
    };
  });
}

function buildKpis(timeline: AnalyticsTimelinePoint[]): AnalyticsKpis {
  const total = timeline.reduce((acc, point) => acc + point.total, 0);
  const research = timeline.reduce((acc, point) => acc + point.research, 0);
  const researchPublished = timeline.reduce((acc, point) => acc + point.researchPublished, 0);
  const conference = timeline.reduce((acc, point) => acc + point.conference, 0);
  const workshop = timeline.reduce((acc, point) => acc + point.workshop, 0);
  const committee = timeline.reduce((acc, point) => acc + point.committee, 0);
  const monthlyRate = timeline.length > 0 ? Math.round(total / timeline.length) : 0;
  const bestPeriod = timeline.reduce(
    (best, point) => (point.total > best.total ? point : best),
    timeline[0] ?? initTimelinePoint("—", "—")
  );

  const last = timeline.at(-1);
  const prev = timeline.at(-2);
  const growthPct = last && prev ? safePercentChange(last.total, prev.total) : 0;

  return {
    total,
    research,
    researchPublished,
    conference,
    workshop,
    committee,
    monthlyRate,
    bestPeriodLabel: bestPeriod.label ?? "—",
    growthPct,
  };
}

function buildPublications(events: ReturnType<typeof getUnifiedEvents> extends Promise<infer T> ? T : never): AnalyticsPublications {
  const venueCounts = new Map<string, number>();
  const scopeCounts = new Map<string, number>();
  const yearlyCounts = new Map<number, number>();

  events.forEach((event) => {
    if (event.type !== "research") return;
    const key = event.venue ?? "غير محدد";
    venueCounts.set(key, (venueCounts.get(key) ?? 0) + 1);
    if (event.scope) {
      const label =
        event.scope === "international" ? "عالمي" : event.scope === "regional" ? "إقليمي" : "محلي";
      scopeCounts.set(label, (scopeCounts.get(label) ?? 0) + 1);
    }
    const year = event.date.getFullYear();
    yearlyCounts.set(year, (yearlyCounts.get(year) ?? 0) + 1);
  });

  const venueEntries = Array.from(venueCounts.entries()).sort((a, b) => b[1] - a[1]);
  const topVenues = venueEntries.slice(0, 8).map(([name, value]) => ({ name, value }));
  const otherCount = venueEntries.slice(8).reduce((sum, [, value]) => sum + value, 0);
  if (otherCount > 0) {
    topVenues.push({ name: "أخرى", value: otherCount });
  }

  const scopeShares = Array.from(scopeCounts.entries()).map(([name, value]) => ({ name, value }));
  const yearly = Array.from(yearlyCounts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, count]) => ({ year, count }));
  const averagePerYear = yearly.length > 0 ? Math.round(yearly.reduce((sum, row) => sum + row.count, 0) / yearly.length) : 0;
  const maxCount = yearly.reduce((max, row) => Math.max(max, row.count), 0);
  const peakYears = yearly.filter((row) => row.count === maxCount).map((row) => row.year);

  return { topVenues, scopeShares, yearly, averagePerYear, peakYears };
}

function buildPerformance(
  events: ReturnType<typeof getUnifiedEvents> extends Promise<infer T> ? T : never,
  filters: AnalyticsFilters
): AnalyticsPerformance {
  const startYear = filters.from.getFullYear();
  const endYear = filters.to.getFullYear();
  const yearsCount = Math.max(0, endYear - startYear + 1);

  const yearlyCounts = new Map<number, number>();
  events.forEach((event) => {
    const year = event.date.getFullYear();
    yearlyCounts.set(year, (yearlyCounts.get(year) ?? 0) + 1);
  });

  const totalActivities = events.length;
  const averagePerYear = yearsCount > 0 ? Math.round(totalActivities / yearsCount) : 0;

  const yearly: Array<{ year: number; count: number; average: number }> = [];
  for (let year = startYear; year <= endYear; year += 1) {
    const count = yearlyCounts.get(year) ?? 0;
    yearly.push({ year, count, average: averagePerYear });
  }

  let bestYear: { year: number; count: number } | undefined = undefined;
  let worstYear: { year: number; count: number } | undefined = undefined;

  yearly.forEach((row) => {
    if (!bestYear || row.count > bestYear.count) {
      bestYear = { year: row.year, count: row.count };
    }
    if (!worstYear || row.count < worstYear.count) {
      worstYear = { year: row.year, count: row.count };
    }
  });

  return { yearly, totalActivities, yearsCount, averagePerYear, bestYear, worstYear };
}

async function buildConferences(userId: string, filters: AnalyticsFilters): Promise<AnalyticsConferences> {
  const conferences = await prisma.researcherConference.findMany({
    where: { researcherId: userId, date: { gte: filters.from, lte: filters.to } },
    select: { date: true, scope: true, participationType: true, isCommitteeMember: true },
  });

  const yearlyCounts = new Map<number, number>();
  const scopeCounts = new Map<string, number>();
  const participationCounts = new Map<string, number>();

  conferences.forEach((conf) => {
    const year = conf.date.getFullYear();
    yearlyCounts.set(year, (yearlyCounts.get(year) ?? 0) + 1);

    const scopeLabel = conf.scope === "GLOBAL" ? "دولي" : "محلي";
    scopeCounts.set(scopeLabel, (scopeCounts.get(scopeLabel) ?? 0) + 1);

    const participationLabel = conf.isCommitteeMember
      ? "عضو لجنة"
      : conf.participationType === "RESEARCHER"
        ? "باحث"
        : "مشارك";
    participationCounts.set(participationLabel, (participationCounts.get(participationLabel) ?? 0) + 1);
  });

  const yearly = Array.from(yearlyCounts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, count]) => ({ year, count }));
  const scopeShares = Array.from(scopeCounts.entries()).map(([name, value]) => ({ name, value }));
  const participationShares = Array.from(participationCounts.entries()).map(([name, value]) => ({ name, value }));

  return { yearly, scopeShares, participationShares };
}

function buildInsights(
  events: ReturnType<typeof getUnifiedEvents> extends Promise<infer T> ? T : never,
  performance: AnalyticsPerformance,
  filters: AnalyticsFilters
): {
  growthText: string;
  warningText: string;
  highlightText: string;
  recommendations: string[];
} {
  const currentYear = filters.to.getFullYear();
  const prevYear = currentYear - 1;
  const currentYearCount = events.filter((event) => event.date.getFullYear() === currentYear).length;
  const prevYearCount = events.filter((event) => event.date.getFullYear() === prevYear).length;
  const yearTrend = safePercentChange(currentYearCount, prevYearCount);

  const growthText =
    yearTrend > 0
      ? `نشاطك العلمي ارتفع ${yearTrend}% مقارنة بالسنة الماضية.`
      : yearTrend < 0
        ? `نشاطك العلمي انخفض ${Math.abs(yearTrend)}% مقارنة بالسنة الماضية.`
        : "نشاطك العلمي ثابت مقارنة بالسنة الماضية.";

  const sixMonthsAgo = subMonths(filters.to, 6);
  const recentResearchCount = events.filter((event) => event.type === "research" && event.date >= sixMonthsAgo).length;
  const warningText =
    recentResearchCount === 0
      ? "لم يتم تسجيل أي بحث خلال آخر 6 أشهر."
      : "استمر في الحفاظ على الوتيرة الحالية.";

  const highlightText = performance.bestYear
    ? `أفضل سنة علمية: ${performance.bestYear.year}.`
    : "أفضل سنة علمية: —";

  return {
    growthText,
    warningText,
    highlightText,
    recommendations: [
      "زيادة مشاركات المؤتمرات خلال الفترة القادمة.",
      "تحويل نشاط واحد إلى بحث منشور.",
      "إضافة ورشة عمل أو لجنة في كل فترة.",
    ],
  };
}

function buildComparison(
  current: AnalyticsTimelinePoint[],
  previous: AnalyticsTimelinePoint[]
): AnalyticsComparison {
  const sum = (list: AnalyticsTimelinePoint[], key: keyof AnalyticsTimelinePoint) =>
    list.reduce((acc, point) => acc + (point[key] as number), 0);

  const delta = {
    total: safePercentChange(sum(current, "total"), sum(previous, "total")),
    research: safePercentChange(sum(current, "research"), sum(previous, "research")),
    conference: safePercentChange(sum(current, "conference"), sum(previous, "conference")),
    workshop: safePercentChange(sum(current, "workshop"), sum(previous, "workshop")),
    committee: safePercentChange(sum(current, "committee"), sum(previous, "committee")),
  };

  return {
    delta,
    timeline: { current, previous },
  };
}

export async function getAnalyticsPayload(userId: string, filters: AnalyticsFilters): Promise<AnalyticsPayload> {
  const events = await getUnifiedEvents(userId, filters.from, filters.to);
  const timeline = buildTimeline(events, filters);
  const kpis = buildKpis(timeline);
  const heatmap = buildHeatmap(events, filters.to);
  const publications = buildPublications(events);
  const performance = buildPerformance(events, filters);
  const conferences = await buildConferences(userId, filters);
  const insights = buildInsights(events, performance, filters);

  let compare: AnalyticsComparison | undefined = undefined;
  if (filters.compareFrom && filters.compareTo) {
    const compareEvents = await getUnifiedEvents(userId, filters.compareFrom, filters.compareTo);
    const compareTimeline = buildTimeline(compareEvents, {
      ...filters,
      from: filters.compareFrom,
      to: filters.compareTo,
    });
    compare = buildComparison(timeline, compareTimeline);
  }

  return {
    timeline,
    kpis,
    heatmap,
    publications,
    conferences,
    performance,
    compare,
    insights,
  };
}
