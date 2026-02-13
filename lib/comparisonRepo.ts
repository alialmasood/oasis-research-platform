import { prisma } from "@/lib/db";

export type ComparisonMetric = {
  key: string;
  label: string;
  value: number;
  weight: number;
};

export type ComparisonCategory = {
  id: string;
  label: string;
  total: number;
  metrics: ComparisonMetric[];
};

export type ComparisonMetricsPoints = Record<string, number>;

export type ComparisonFaculty = {
  id: string;
  fullName: string;
  collegeName: string;
  departmentName: string;
  academicTitle: string;
  avatarUrl?: string | null;
  totalPoints: number;
  metrics: ComparisonMetricsPoints;
  researchCount: number;
  activitiesCount: number;
  conferencesCount: number;
  positionsCount: number;
  coursesCount: number;
  seminarsCount: number;
  committeesCount: number;
  volunteeringCount: number;
  fieldVisitsCount: number;
  assignmentsCount: number;
  certificatesCount: number;
  thanksCount: number;
  supervisionCount: number;
  reviewingCount: number;
  journalsCount: number;
  workshopsCount: number;
};

export type ComparisonBadge = {
  code: string;
  label: string;
  description?: string;
};

export type SimilarFacultyEntry = {
  userId: string;
  name: string;
  department: string;
  distance: number;
  sharedTags: string[];
  score: number;
  pointDiff: number;
  researchCount: number;
  conferencesCount: number;
  positionsCount: number;
  coursesCount: number;
  seminarsCount: number;
  committeesCount: number;
  volunteeringCount: number;
  fieldVisitsCount: number;
};

export type MetricLeaderboardEntry = {
  id: string;
  fullName: string;
  departmentName: string;
  totalPoints: number;
  metricValue: number;
};

export type MetricTabData = {
  id: string;
  label: string;
  myRank: number;
  top10: MetricLeaderboardEntry[];
  chartData: Array<{ name: string; value: number; isUser?: boolean }>;
};

export type ActivityTrendYear = {
  year: number;
  points: number;
  research: number;
  conferences: number;
  courses: number;
  isCurrent: boolean;
  isBest: boolean;
};

export type ActivityTrendMonth = {
  month: number;
  points: number;
  isBest: boolean;
  research: number;
  conferences: number;
  courses: number;
};

export type ActivityTrends = {
  yearly: ActivityTrendYear[];
  monthly: ActivityTrendMonth[];
  bestYear: number | null;
  bestMonth: number | null;
};

export type ComparisonOverview = {
  totalResearchers: number;
  totalPoints: number;
  averagePoints: number;
  collegeAveragePoints: number;
  departmentAveragePoints: number;
  researchCount: number;
  activitiesCount: number;
};

export type ComparisonPageData = {
  currentUser: ComparisonFaculty;
  overview: ComparisonOverview;
  nextStep: {
    metricLabel: string;
    pointsToAdd: number;
    estimatedCollegeRankGain: number;
  };
  activityTrends: ActivityTrends;
  specialization: {
    sameAcademicTitle: ComparisonFaculty[];
    sameSpecialization: ComparisonFaculty[];
    specializationLabel: string;
  };
  ranks: {
    universityRank: number;
    collegeRank: number;
    departmentRank: number;
  };
  top3University: ComparisonFaculty[];
  top10University: ComparisonFaculty[];
  top5College: ComparisonFaculty[];
  top3Department: ComparisonFaculty[];
  badges: ComparisonBadge[];
  similar: SimilarFacultyEntry[];
  categories: ComparisonCategory[];
  metricTabs: MetricTabData[];
};

export type ComparisonFilters = {
  year?: number;
  period?: "all" | "first" | "second";
  metric?: string;
};

type CountMap = Record<string, number>;

function mapCounts(rows: Array<{ researcherId: string; _count: { _all: number } }>): CountMap {
  return rows.reduce<CountMap>((acc, row) => {
    acc[row.researcherId] = row._count._all;
    return acc;
  }, {});
}

function getDisplayName(user: { fullNameAr: string | null; fullNameEn: string | null; email: string }) {
  return user.fullNameAr?.trim() || user.fullNameEn?.trim() || user.email;
}

function formatDepartment(user: { department?: string | null; departmentRelation?: { name: string } | null }) {
  return user.departmentRelation?.name || user.department || "غير محدد";
}

function formatCollege(user: { entity?: string | null }) {
  return user.entity?.trim() || "غير محدد";
}

function buildCategories(counts: Record<string, number>): ComparisonCategory[] {
  const researchMetrics: ComparisonMetric[] = [
    { key: "research", label: "الأبحاث", value: counts.research, weight: 5 },
    { key: "journals", label: "عضويات المجلات", value: counts.journals, weight: 3 },
    { key: "reviewing", label: "التقويمات العلمية", value: counts.reviewing, weight: 2 },
  ];

  const academicMetrics: ComparisonMetric[] = [
    { key: "supervision", label: "الإشرافات", value: counts.supervision, weight: 4 },
    { key: "courses", label: "الدورات", value: counts.courses, weight: 2 },
    { key: "seminars", label: "الندوات", value: counts.seminars, weight: 2 },
    { key: "workshops", label: "ورش العمل", value: counts.workshops, weight: 2 },
  ];

  const serviceMetrics: ComparisonMetric[] = [
    { key: "conferences", label: "المؤتمرات", value: counts.conferences, weight: 2 },
    { key: "committees", label: "اللجان", value: counts.committees, weight: 2 },
    { key: "volunteering", label: "الأعمال الطوعية", value: counts.volunteering, weight: 2 },
    { key: "fieldVisits", label: "الزيارات الميدانية", value: counts.fieldVisits, weight: 2 },
    { key: "assignments", label: "التكليفات", value: counts.assignments, weight: 1 },
    { key: "certificates", label: "شهادات المشاركة", value: counts.certificates, weight: 1 },
    { key: "thanks", label: "كتب الشكر", value: counts.thanks, weight: 1 },
    { key: "positions", label: "المناصب", value: counts.positions, weight: 1 },
  ];

  const sumCategory = (metrics: ComparisonMetric[]) =>
    metrics.reduce((acc, metric) => acc + metric.value * metric.weight, 0);

  return [
    { id: "research", label: "البحوث والتحكيم", total: sumCategory(researchMetrics), metrics: researchMetrics },
    { id: "academic", label: "التدريس والإشراف", total: sumCategory(academicMetrics), metrics: academicMetrics },
    { id: "service", label: "الخدمة المجتمعية والإدارية", total: sumCategory(serviceMetrics), metrics: serviceMetrics },
  ];
}

function computeScore(categories: ComparisonCategory[]) {
  return categories.reduce((acc, category) => acc + category.total, 0);
}

function computeBadges(args: {
  uniRank: number;
  collegeRank: number;
  topMetric: string | null;
  growthPct: number | null;
}): ComparisonBadge[] {
  const badges: ComparisonBadge[] = [];
  if (args.uniRank <= 3) {
    badges.push({
      code: "TOP3_UNI",
      label: "ضمن أعلى 3 في الجامعة",
      description: "أداء استثنائي على مستوى الجامعة.",
    });
  } else if (args.uniRank <= 10) {
    badges.push({
      code: "TOP10_UNI",
      label: "ضمن أعلى 10 في الجامعة",
      description: "ضمن النخبة الأعلى في الجامعة.",
    });
  }
  if (args.collegeRank <= 5) {
    badges.push({
      code: "TOP5_COLLEGE",
      label: "ضمن أعلى 5 في الكلية",
      description: "أداء قوي مقارنة بزملاء الكلية.",
    });
  }
  if (args.topMetric) {
    badges.push({
      code: "SPECIALIST",
      label: `متميز في معيار: ${args.topMetric}`,
      description: "هذا هو معيار القوة الأكبر لديك حالياً.",
    });
  }
  if (args.growthPct != null && args.growthPct >= 20) {
    badges.push({
      code: "IMPROVER",
      label: "تحسن ملحوظ هذا العام",
      description: "تقدم واضح مقارنة بالفترة السابقة.",
    });
  }
  return badges;
}

function sumActivities(counts: Record<string, number>) {
  return (
    counts.conferences +
    counts.committees +
    counts.volunteering +
    counts.fieldVisits +
    counts.assignments +
    counts.certificates +
    counts.thanks +
    counts.positions +
    counts.courses +
    counts.seminars +
    counts.workshops +
    counts.supervision +
    counts.reviewing +
    counts.journals
  );
}

function getSpecializationLabel(user?: {
  specificSpecialization?: string | null;
  generalSpecialization?: string | null;
}) {
  return user?.specificSpecialization?.trim() || user?.generalSpecialization?.trim() || "تخصص غير محدد";
}

async function getActivityTrends(
  userId: string,
  range: { start: Date; end: Date } | null,
  targetYear: number
): Promise<ActivityTrends> {
  const currentYear = targetYear;
  const yearlyPoints = new Map<number, { points: number; research: number; conferences: number; courses: number }>();
  const monthlyPoints = new Map<number, ActivityTrendMonth>(
    Array.from({ length: 12 }).map((_, index) => [
      index + 1,
      {
        month: index + 1,
        points: 0,
        isBest: false,
        research: 0,
        conferences: 0,
        courses: 0,
      },
    ])
  );

  const addPoints = (date: Date, points: number, metricKey?: "research" | "conferences" | "courses") => {
    if (range && (date < range.start || date > range.end)) return;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const yearEntry = yearlyPoints.get(year) ?? { points: 0, research: 0, conferences: 0, courses: 0 };
    yearEntry.points += points;
    if (metricKey) {
      yearEntry[metricKey] += points;
    }
    yearlyPoints.set(year, yearEntry);
    if (year === currentYear) {
      const monthEntry = monthlyPoints.get(month);
      if (monthEntry) {
        monthEntry.points += points;
        if (metricKey) {
          monthEntry[metricKey] += points;
        }
      }
    }
  };

  const [
    research,
    conferences,
    journals,
    reviewing,
    supervision,
    courses,
    seminars,
    workshops,
    assignments,
    thanks,
    committees,
    certificates,
    volunteerings,
    fieldVisits,
    positions,
  ] = await Promise.all([
    prisma.research.findMany({ where: { researcherId: userId }, select: { createdAt: true } }),
    prisma.researcherConference.findMany({ where: { researcherId: userId }, select: { date: true } }),
    prisma.journal.findMany({ where: { researcherId: userId }, select: { startDate: true } }),
    prisma.reviewing.findMany({ where: { researcherId: userId }, select: { date: true } }),
    prisma.supervision.findMany({ where: { researcherId: userId }, select: { startDate: true } }),
    prisma.course.findMany({ where: { researcherId: userId }, select: { date: true } }),
    prisma.seminar.findMany({ where: { researcherId: userId }, select: { date: true } }),
    prisma.workshop.findMany({ where: { researcherId: userId }, select: { date: true } }),
    prisma.assignment.findMany({ where: { researcherId: userId }, select: { assignmentDate: true } }),
    prisma.thankYouLetter.findMany({ where: { researcherId: userId }, select: { date: true } }),
    prisma.committee.findMany({ where: { researcherId: userId }, select: { assignmentDate: true } }),
    prisma.certificate.findMany({ where: { researcherId: userId }, select: { date: true } }),
    prisma.volunteering.findMany({ where: { researcherId: userId }, select: { startDate: true } }),
    prisma.fieldVisit.findMany({ where: { researcherId: userId }, select: { activityDate: true } }),
    prisma.position.findMany({ where: { researcherId: userId }, select: { positionDate: true } }),
  ]);

  research.forEach((row) => addPoints(row.createdAt, 5, "research"));
  journals.forEach((row) => addPoints(row.startDate, 3));
  reviewing.forEach((row) => addPoints(row.date, 2));
  supervision.forEach((row) => addPoints(row.startDate, 4));
  courses.forEach((row) => addPoints(row.date, 2, "courses"));
  seminars.forEach((row) => addPoints(row.date, 2));
  workshops.forEach((row) => addPoints(row.date, 2));
  conferences.forEach((row) => addPoints(row.date, 2, "conferences"));
  committees.forEach((row) => addPoints(row.assignmentDate, 2));
  volunteerings.forEach((row) => addPoints(row.startDate, 2));
  fieldVisits.forEach((row) => addPoints(row.activityDate, 2));
  assignments.forEach((row) => addPoints(row.assignmentDate, 1));
  certificates.forEach((row) => addPoints(row.date, 1));
  thanks.forEach((row) => addPoints(row.date, 1));
  positions.forEach((row) => addPoints(row.positionDate, 1));

  const yearly = Array.from(yearlyPoints.entries())
    .map(([year, payload]) => ({
      year,
      points: payload.points,
      research: payload.research,
      conferences: payload.conferences,
      courses: payload.courses,
      isCurrent: year === currentYear,
      isBest: false,
    }))
    .sort((a, b) => a.year - b.year);

  let bestYear: number | null = null;
  let bestYearPoints = 0;
  yearly.forEach((entry) => {
    if (entry.points > bestYearPoints) {
      bestYearPoints = entry.points;
      bestYear = entry.year;
    }
  });
  yearly.forEach((entry) => {
    if (entry.year === bestYear) entry.isBest = true;
  });

  const monthly = Array.from(monthlyPoints.values());
  let bestMonth: number | null = null;
  let bestMonthPoints = 0;
  monthly.forEach((entry) => {
    if (entry.points > bestMonthPoints) {
      bestMonthPoints = entry.points;
      bestMonth = entry.month;
    }
  });
  monthly.forEach((entry) => {
    entry.isBest = entry.month === bestMonth;
  });

  return {
    yearly,
    monthly,
    bestYear,
    bestMonth,
  };
}

function getDateRange(filters?: ComparisonFilters) {
  if (!filters?.year) return null;
  const year = filters.year;
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  if (filters.period === "first") {
    return { start: new Date(year, 0, 1), end: new Date(year, 5, 30, 23, 59, 59, 999) };
  }
  if (filters.period === "second") {
    return { start: new Date(year, 6, 1), end: new Date(year, 11, 31, 23, 59, 59, 999) };
  }
  return { start, end };
}

function rangeWhere(field: string, range: { start: Date; end: Date } | null) {
  if (!range) return undefined;
  return { [field]: { gte: range.start, lte: range.end } } as Record<string, unknown>;
}

export async function getComparisonData(
  userId: string,
  filters?: ComparisonFilters
): Promise<ComparisonPageData> {
  const range = getDateRange(filters);
  const users = await prisma.user.findMany({
    where: { role: "RESEARCHER", isActive: true },
    select: {
      id: true,
      email: true,
      fullNameAr: true,
      fullNameEn: true,
      academicTitle: true,
      department: true,
      entity: true,
      generalSpecialization: true,
      specificSpecialization: true,
      departmentRelation: { select: { name: true } },
      researcherProfile: { select: { avatarUrl: true } },
    },
  });

  const [
    researchCounts,
    conferenceCounts,
    journalCounts,
    reviewingCounts,
    supervisionCounts,
    courseCounts,
    seminarCounts,
    workshopCounts,
    assignmentCounts,
    thankCounts,
    committeeCounts,
    certificateCounts,
    volunteeringCounts,
    fieldVisitCounts,
    positionCounts,
    activityTrends,
  ] = await Promise.all([
    prisma.research.groupBy({ by: ["researcherId"], _count: { _all: true }, where: rangeWhere("createdAt", range) }),
    prisma.researcherConference.groupBy({ by: ["researcherId"], _count: { _all: true }, where: rangeWhere("date", range) }),
    prisma.journal.groupBy({ by: ["researcherId"], _count: { _all: true }, where: rangeWhere("startDate", range) }),
    prisma.reviewing.groupBy({ by: ["researcherId"], _count: { _all: true }, where: rangeWhere("date", range) }),
    prisma.supervision.groupBy({ by: ["researcherId"], _count: { _all: true }, where: rangeWhere("startDate", range) }),
    prisma.course.groupBy({ by: ["researcherId"], _count: { _all: true }, where: rangeWhere("date", range) }),
    prisma.seminar.groupBy({ by: ["researcherId"], _count: { _all: true }, where: rangeWhere("date", range) }),
    prisma.workshop.groupBy({ by: ["researcherId"], _count: { _all: true }, where: rangeWhere("date", range) }),
    prisma.assignment.groupBy({ by: ["researcherId"], _count: { _all: true }, where: rangeWhere("assignmentDate", range) }),
    prisma.thankYouLetter.groupBy({ by: ["researcherId"], _count: { _all: true }, where: rangeWhere("date", range) }),
    prisma.committee.groupBy({ by: ["researcherId"], _count: { _all: true }, where: rangeWhere("assignmentDate", range) }),
    prisma.certificate.groupBy({ by: ["researcherId"], _count: { _all: true }, where: rangeWhere("date", range) }),
    prisma.volunteering.groupBy({ by: ["researcherId"], _count: { _all: true }, where: rangeWhere("startDate", range) }),
    prisma.fieldVisit.groupBy({ by: ["researcherId"], _count: { _all: true }, where: rangeWhere("activityDate", range) }),
    prisma.position.groupBy({ by: ["researcherId"], _count: { _all: true }, where: rangeWhere("positionDate", range) }),
    getActivityTrends(userId, range, filters?.year ?? new Date().getFullYear()),
  ]);

  const countsByUser = {
    research: mapCounts(researchCounts),
    conferences: mapCounts(conferenceCounts),
    journals: mapCounts(journalCounts),
    reviewing: mapCounts(reviewingCounts),
    supervision: mapCounts(supervisionCounts),
    courses: mapCounts(courseCounts),
    seminars: mapCounts(seminarCounts),
    workshops: mapCounts(workshopCounts),
    assignments: mapCounts(assignmentCounts),
    thanks: mapCounts(thankCounts),
    committees: mapCounts(committeeCounts),
    certificates: mapCounts(certificateCounts),
    volunteering: mapCounts(volunteeringCounts),
    fieldVisits: mapCounts(fieldVisitCounts),
    positions: mapCounts(positionCounts),
  } as const;

  const entries = users.map((user) => {
    const counts = {
      research: countsByUser.research[user.id] ?? 0,
      conferences: countsByUser.conferences[user.id] ?? 0,
      journals: countsByUser.journals[user.id] ?? 0,
      reviewing: countsByUser.reviewing[user.id] ?? 0,
      supervision: countsByUser.supervision[user.id] ?? 0,
      courses: countsByUser.courses[user.id] ?? 0,
      seminars: countsByUser.seminars[user.id] ?? 0,
      workshops: countsByUser.workshops[user.id] ?? 0,
      assignments: countsByUser.assignments[user.id] ?? 0,
      thanks: countsByUser.thanks[user.id] ?? 0,
      committees: countsByUser.committees[user.id] ?? 0,
      certificates: countsByUser.certificates[user.id] ?? 0,
      volunteering: countsByUser.volunteering[user.id] ?? 0,
      fieldVisits: countsByUser.fieldVisits[user.id] ?? 0,
      positions: countsByUser.positions[user.id] ?? 0,
    };

    const categories = buildCategories(counts);
    const score = computeScore(categories);
    const researchCount = counts.research;
    const activitiesCount = sumActivities(counts);
    const metricsPoints: ComparisonMetricsPoints = Object.fromEntries(
      categories.flatMap((category) =>
        category.metrics.map((metric) => [metric.key, metric.value * metric.weight])
      )
    );

    return {
      userId: user.id,
      name: getDisplayName(user),
      department: formatDepartment(user),
      college: formatCollege(user),
      academicTitle: user.academicTitle?.trim() || "غير محدد",
      avatarUrl: user.researcherProfile?.avatarUrl ?? null,
      score,
      counts,
      researchCount,
      activitiesCount,
      categories,
      metricsPoints,
      raw: user,
    };
  });

  const sorted = [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.researchCount !== a.researchCount) return b.researchCount - a.researchCount;
    return b.activitiesCount - a.activitiesCount;
  });

  const totalResearchers = sorted.length;
  const currentEntry = entries.find((entry) => entry.userId === userId);
  const currentCounts = currentEntry?.counts ?? {
    research: 0,
    conferences: 0,
    journals: 0,
    reviewing: 0,
    supervision: 0,
    courses: 0,
    seminars: 0,
    workshops: 0,
    assignments: 0,
    thanks: 0,
    committees: 0,
    certificates: 0,
    volunteering: 0,
    fieldVisits: 0,
    positions: 0,
  };

  const currentCategories = currentEntry?.categories ?? buildCategories(currentCounts);
  const currentScore = currentEntry?.score ?? 0;

  const universityRank = sorted.findIndex((entry) => entry.userId === userId) + 1 || totalResearchers;

  const collegeKey = currentEntry?.college ?? "";
  const collegeEntries = sorted.filter((entry) => entry.college === collegeKey);
  const collegeRank = collegeEntries.findIndex((entry) => entry.userId === userId) + 1 || collegeEntries.length;

  const departmentKey = currentEntry?.department ?? "";
  const departmentEntries = sorted.filter((entry) => entry.department === departmentKey);
  const departmentRank = departmentEntries.findIndex((entry) => entry.userId === userId) + 1 || departmentEntries.length;

  const collegeAveragePoints =
    collegeEntries.length > 0
      ? Math.round(collegeEntries.reduce((sum, entry) => sum + entry.score, 0) / collegeEntries.length)
      : 0;
  const departmentAveragePoints =
    departmentEntries.length > 0
      ? Math.round(departmentEntries.reduce((sum, entry) => sum + entry.score, 0) / departmentEntries.length)
      : 0;

  const overview: ComparisonOverview = {
    totalResearchers,
    totalPoints: currentScore,
    averagePoints: totalResearchers > 0 ? Math.round(sorted.reduce((sum, entry) => sum + entry.score, 0) / totalResearchers) : 0,
    collegeAveragePoints,
    departmentAveragePoints,
    researchCount: currentCounts.research,
    activitiesCount: sumActivities(currentCounts),
  };

  const topMetricEntry = currentEntry?.metricsPoints
    ? Object.entries(currentEntry.metricsPoints).sort((a, b) => b[1] - a[1])[0]
    : null;
  const topMetricLabel = topMetricEntry ? currentCategories.flatMap((c) => c.metrics).find((m) => m.key === topMetricEntry[0])?.label ?? null : null;

  const weakestMetricEntry = currentEntry?.metricsPoints
    ? Object.entries(currentEntry.metricsPoints).sort((a, b) => a[1] - b[1])[0]
    : null;
  const weakestMetricLabel =
    weakestMetricEntry
      ? currentCategories
          .flatMap((c) => c.metrics)
          .find((m) => m.key === weakestMetricEntry[0])?.label ?? "معيار إضافي"
      : "معيار إضافي";
  const pointsToAdd = 15;
  const projectedScore = currentScore + pointsToAdd;
  const projectedCollegeRank =
    collegeEntries.length > 0
      ? collegeEntries.filter((entry) => entry.score > projectedScore).length + 1
      : collegeRank;
  const estimatedCollegeRankGain = Math.max(0, collegeRank - projectedCollegeRank);

  const badges = computeBadges({
    uniRank: universityRank,
    collegeRank,
    topMetric: topMetricLabel,
    growthPct: null,
  });

  const currentUser = users.find((u) => u.id === userId);
  const specializationLabel = getSpecializationLabel(currentUser ?? undefined);
  const sameAcademicTitle = sorted
    .filter((entry) => entry.userId !== userId && entry.academicTitle === (currentEntry?.academicTitle ?? ""))
    .slice(0, 5);
  const sameSpecialization = sorted
    .filter((entry) => {
      if (entry.userId === userId) return false;
      const currentSpecific = currentUser?.specificSpecialization?.trim();
      const currentGeneral = currentUser?.generalSpecialization?.trim();
      const entrySpecific = entry.raw.specificSpecialization?.trim();
      const entryGeneral = entry.raw.generalSpecialization?.trim();
      if (currentSpecific) return entrySpecific === currentSpecific;
      if (currentGeneral) return entryGeneral === currentGeneral;
      return false;
    })
    .slice(0, 5);
  const pointBandMin = currentScore * 0.85;
  const pointBandMax = currentScore * 1.15;
  const currentAcademicTitle = currentEntry?.academicTitle ?? "";
  const currentCollege = currentEntry?.college ?? "";

  const metricKeys = Object.keys(currentEntry?.metricsPoints ?? {});

  const similarCandidates = entries.filter((entry) => {
    if (entry.userId === userId) return false;
    const inBand = entry.score >= pointBandMin && entry.score <= pointBandMax;
    const sameTitle = currentAcademicTitle && entry.academicTitle === currentAcademicTitle;
    const sameCollege = currentCollege && entry.college === currentCollege;
    return inBand && (sameTitle || sameCollege);
  });

  const expandedCandidates =
    similarCandidates.length >= 6
      ? similarCandidates
      : [
          ...similarCandidates,
          ...entries.filter((entry) => {
            if (entry.userId === userId) return false;
            const inBand = entry.score >= pointBandMin && entry.score <= pointBandMax;
            return inBand && !similarCandidates.includes(entry);
          }),
        ];

  const similar = expandedCandidates
    .map((entry) => {
      const distance = metricKeys.reduce((acc, key) => {
        const myValue = currentEntry?.metricsPoints[key] ?? 0;
        const theirValue = entry.metricsPoints[key] ?? 0;
        return acc + Math.abs(myValue - theirValue);
      }, 0);

      const sharedTags: string[] = [];
      if (currentAcademicTitle && entry.academicTitle === currentAcademicTitle) {
        sharedTags.push("نفس اللقب العلمي");
      }
      if (currentCollege && entry.college === currentCollege) {
        sharedTags.push("نفس الكلية");
      }

      return {
        userId: entry.userId,
        name: entry.name,
        department: entry.department,
        distance,
        sharedTags,
        score: entry.score,
        pointDiff: Math.abs(entry.score - currentScore),
        researchCount: entry.counts.research,
        conferencesCount: entry.counts.conferences,
        positionsCount: entry.counts.positions,
        coursesCount: entry.counts.courses,
        seminarsCount: entry.counts.seminars,
        committeesCount: entry.counts.committees,
        volunteeringCount: entry.counts.volunteering,
        fieldVisitsCount: entry.counts.fieldVisits,
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 12);

  const metricDefinitions: Array<{
    id: string;
    label: string;
    getValue: (entry: typeof entries[number]) => number;
  }> = [
    { id: "total", label: "الكل (Total)", getValue: (entry) => entry.score },
    { id: "research", label: "البحث", getValue: (entry) => entry.metricsPoints.research ?? 0 },
    { id: "conferences", label: "المؤتمرات", getValue: (entry) => entry.metricsPoints.conferences ?? 0 },
    {
      id: "publishing",
      label: "النشر/الكتب",
      getValue: (entry) => (entry.metricsPoints.research ?? 0) + (entry.metricsPoints.journals ?? 0),
    },
    { id: "supervision", label: "الإشراف على الطلبة", getValue: (entry) => entry.metricsPoints.supervision ?? 0 },
    { id: "courses", label: "الدورات", getValue: (entry) => entry.metricsPoints.courses ?? 0 },
    { id: "reviewing", label: "التقويم العلمي", getValue: (entry) => entry.metricsPoints.reviewing ?? 0 },
    { id: "assignments", label: "التكليفات", getValue: (entry) => entry.metricsPoints.assignments ?? 0 },
    { id: "positions", label: "المناصب", getValue: (entry) => entry.metricsPoints.positions ?? 0 },
    { id: "volunteering", label: "الأعمال الطوعية", getValue: (entry) => entry.metricsPoints.volunteering ?? 0 },
    { id: "fieldVisits", label: "الزيارات الميدانية", getValue: (entry) => entry.metricsPoints.fieldVisits ?? 0 },
  ];

  const metricTabs: MetricTabData[] = metricDefinitions.map((metric) => {
    const sortedByMetric = [...entries].sort((a, b) => {
      const diff = metric.getValue(b) - metric.getValue(a);
      if (diff !== 0) return diff;
      return b.score - a.score;
    });
    const myRank = sortedByMetric.findIndex((entry) => entry.userId === userId) + 1 || sortedByMetric.length;
    const top10 = sortedByMetric.slice(0, 10).map((entry) => ({
      id: entry.userId,
      fullName: entry.name,
      departmentName: entry.department,
      totalPoints: entry.score,
      metricValue: metric.getValue(entry),
    }));
    const top5 = sortedByMetric.slice(0, 5);
    const inTop5 = top5.some((entry) => entry.userId === userId);
    const chartBase = top5.map((entry) => ({
      name: entry.userId === userId ? "أنت" : entry.name,
      value: metric.getValue(entry),
      isUser: entry.userId === userId,
    }));
    if (!inTop5 && currentEntry) {
      chartBase.push({ name: "أنت", value: metric.getValue(currentEntry), isUser: true });
    }
    return {
      id: metric.id,
      label: metric.label,
      myRank,
      top10,
      chartData: chartBase,
    };
  });

  return {
    currentUser: {
      id: userId,
      fullName: currentEntry?.name ?? "باحث",
      collegeName: currentEntry?.college ?? "غير محدد",
      departmentName: currentEntry?.department ?? "غير محدد",
      academicTitle: currentEntry?.academicTitle ?? "غير محدد",
      avatarUrl: currentEntry?.avatarUrl ?? null,
      totalPoints: currentScore,
      metrics: currentEntry?.metricsPoints ?? {},
      researchCount: currentCounts.research,
      activitiesCount: sumActivities(currentCounts),
      conferencesCount: currentCounts.conferences,
      positionsCount: currentCounts.positions,
      coursesCount: currentCounts.courses,
      seminarsCount: currentCounts.seminars,
      committeesCount: currentCounts.committees,
      volunteeringCount: currentCounts.volunteering,
      fieldVisitsCount: currentCounts.fieldVisits,
      assignmentsCount: currentCounts.assignments,
      certificatesCount: currentCounts.certificates,
      thanksCount: currentCounts.thanks,
      supervisionCount: currentCounts.supervision,
      reviewingCount: currentCounts.reviewing,
      journalsCount: currentCounts.journals,
      workshopsCount: currentCounts.workshops,
    },
    overview,
    nextStep: {
      metricLabel: weakestMetricLabel,
      pointsToAdd,
      estimatedCollegeRankGain,
    },
    activityTrends,
    specialization: {
      sameAcademicTitle: sameAcademicTitle.map((entry) => ({
        id: entry.userId,
        fullName: entry.name,
        collegeName: entry.college,
        departmentName: entry.department,
        academicTitle: entry.academicTitle,
        avatarUrl: entry.avatarUrl ?? null,
        totalPoints: entry.score,
        metrics: entry.metricsPoints,
        researchCount: entry.researchCount,
        activitiesCount: entry.activitiesCount,
        conferencesCount: entry.counts.conferences,
        positionsCount: entry.counts.positions,
        coursesCount: entry.counts.courses,
        seminarsCount: entry.counts.seminars,
        committeesCount: entry.counts.committees,
        volunteeringCount: entry.counts.volunteering,
        fieldVisitsCount: entry.counts.fieldVisits,
        assignmentsCount: entry.counts.assignments,
        certificatesCount: entry.counts.certificates,
        thanksCount: entry.counts.thanks,
        supervisionCount: entry.counts.supervision,
        reviewingCount: entry.counts.reviewing,
        journalsCount: entry.counts.journals,
        workshopsCount: entry.counts.workshops,
      })),
      sameSpecialization: sameSpecialization.map((entry) => ({
        id: entry.userId,
        fullName: entry.name,
        collegeName: entry.college,
        departmentName: entry.department,
        academicTitle: entry.academicTitle,
        avatarUrl: entry.avatarUrl ?? null,
        totalPoints: entry.score,
        metrics: entry.metricsPoints,
        researchCount: entry.researchCount,
        activitiesCount: entry.activitiesCount,
        conferencesCount: entry.counts.conferences,
        positionsCount: entry.counts.positions,
        coursesCount: entry.counts.courses,
        seminarsCount: entry.counts.seminars,
        committeesCount: entry.counts.committees,
        volunteeringCount: entry.counts.volunteering,
        fieldVisitsCount: entry.counts.fieldVisits,
        assignmentsCount: entry.counts.assignments,
        certificatesCount: entry.counts.certificates,
        thanksCount: entry.counts.thanks,
        supervisionCount: entry.counts.supervision,
        reviewingCount: entry.counts.reviewing,
        journalsCount: entry.counts.journals,
        workshopsCount: entry.counts.workshops,
      })),
      specializationLabel,
    },
    ranks: {
      universityRank,
      collegeRank,
      departmentRank,
    },
    top3University: sorted.slice(0, 3).map((entry) => ({
      id: entry.userId,
      fullName: entry.name,
      collegeName: entry.college,
      departmentName: entry.department,
      academicTitle: entry.academicTitle,
      avatarUrl: entry.avatarUrl ?? null,
      totalPoints: entry.score,
      metrics: entry.metricsPoints,
      researchCount: entry.researchCount,
      activitiesCount: entry.activitiesCount,
      conferencesCount: entry.counts.conferences,
      positionsCount: entry.counts.positions,
      coursesCount: entry.counts.courses,
      seminarsCount: entry.counts.seminars,
      committeesCount: entry.counts.committees,
      volunteeringCount: entry.counts.volunteering,
      fieldVisitsCount: entry.counts.fieldVisits,
      assignmentsCount: entry.counts.assignments,
      certificatesCount: entry.counts.certificates,
      thanksCount: entry.counts.thanks,
      supervisionCount: entry.counts.supervision,
      reviewingCount: entry.counts.reviewing,
      journalsCount: entry.counts.journals,
      workshopsCount: entry.counts.workshops,
    })),
    top10University: sorted.slice(0, 10).map((entry) => ({
      id: entry.userId,
      fullName: entry.name,
      collegeName: entry.college,
      departmentName: entry.department,
      academicTitle: entry.academicTitle,
      avatarUrl: entry.avatarUrl ?? null,
      totalPoints: entry.score,
      metrics: entry.metricsPoints,
      researchCount: entry.researchCount,
      activitiesCount: entry.activitiesCount,
      conferencesCount: entry.counts.conferences,
      positionsCount: entry.counts.positions,
      coursesCount: entry.counts.courses,
      seminarsCount: entry.counts.seminars,
      committeesCount: entry.counts.committees,
      volunteeringCount: entry.counts.volunteering,
      fieldVisitsCount: entry.counts.fieldVisits,
      assignmentsCount: entry.counts.assignments,
      certificatesCount: entry.counts.certificates,
      thanksCount: entry.counts.thanks,
      supervisionCount: entry.counts.supervision,
      reviewingCount: entry.counts.reviewing,
      journalsCount: entry.counts.journals,
      workshopsCount: entry.counts.workshops,
    })),
    top5College: collegeEntries.slice(0, 5).map((entry) => ({
      id: entry.userId,
      fullName: entry.name,
      collegeName: entry.college,
      departmentName: entry.department,
      academicTitle: entry.academicTitle,
      avatarUrl: entry.avatarUrl ?? null,
      totalPoints: entry.score,
      metrics: entry.metricsPoints,
      researchCount: entry.researchCount,
      activitiesCount: entry.activitiesCount,
      conferencesCount: entry.counts.conferences,
      positionsCount: entry.counts.positions,
      coursesCount: entry.counts.courses,
      seminarsCount: entry.counts.seminars,
      committeesCount: entry.counts.committees,
      volunteeringCount: entry.counts.volunteering,
      fieldVisitsCount: entry.counts.fieldVisits,
      assignmentsCount: entry.counts.assignments,
      certificatesCount: entry.counts.certificates,
      thanksCount: entry.counts.thanks,
      supervisionCount: entry.counts.supervision,
      reviewingCount: entry.counts.reviewing,
      journalsCount: entry.counts.journals,
      workshopsCount: entry.counts.workshops,
    })),
    top3Department: departmentEntries.slice(0, 3).map((entry) => ({
      id: entry.userId,
      fullName: entry.name,
      collegeName: entry.college,
      departmentName: entry.department,
      academicTitle: entry.academicTitle,
      avatarUrl: entry.avatarUrl ?? null,
      totalPoints: entry.score,
      metrics: entry.metricsPoints,
      researchCount: entry.researchCount,
      activitiesCount: entry.activitiesCount,
      conferencesCount: entry.counts.conferences,
      positionsCount: entry.counts.positions,
      coursesCount: entry.counts.courses,
      seminarsCount: entry.counts.seminars,
      committeesCount: entry.counts.committees,
      volunteeringCount: entry.counts.volunteering,
      fieldVisitsCount: entry.counts.fieldVisits,
      assignmentsCount: entry.counts.assignments,
      certificatesCount: entry.counts.certificates,
      thanksCount: entry.counts.thanks,
      supervisionCount: entry.counts.supervision,
      reviewingCount: entry.counts.reviewing,
      journalsCount: entry.counts.journals,
      workshopsCount: entry.counts.workshops,
    })),
    badges,
    similar,
    categories: currentCategories,
    metricTabs,
  };
}
