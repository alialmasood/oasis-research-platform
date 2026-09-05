export type ResearchPeriod = "all" | "month" | "year" | "academic" | "semester";

export type PeriodInfo = {
  id: ResearchPeriod;
  label: string;
  description: string;
};

export function getAcademicYearBounds(date: Date = new Date()) {
  const calYear = date.getFullYear();
  const month = date.getMonth() + 1;
  const startYear = month >= 9 ? calYear : calYear - 1;
  const endYear = startYear + 1;
  const start = new Date(startYear, 8, 1, 0, 0, 0, 0);
  const end = new Date(endYear, 7, 31, 23, 59, 59, 999);
  return {
    startYear,
    endYear,
    start,
    end,
    label: `${startYear} – ${endYear}`,
  };
}

export function getCurrentSemester(date: Date = new Date()): {
  id: "1" | "2" | "summer";
  label: string;
  months: number[];
} {
  const month = date.getMonth() + 1;
  if ([9, 10, 11, 12, 1].includes(month)) {
    return { id: "1", label: "الفصل الأول", months: [9, 10, 11, 12, 1] };
  }
  if ([2, 3, 4, 5, 6].includes(month)) {
    return { id: "2", label: "الفصل الثاني", months: [2, 3, 4, 5, 6] };
  }
  return { id: "summer", label: "العطلة الصيفية", months: [7, 8] };
}

export function getMonthBounds(date: Date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end, month: date.getMonth() + 1, year: date.getFullYear() };
}

export function getYearBounds(date: Date = new Date()) {
  const year = date.getFullYear();
  return {
    year,
    start: new Date(year, 0, 1, 0, 0, 0, 0),
    end: new Date(year, 11, 31, 23, 59, 59, 999),
  };
}

export function getPeriodOptions(now: Date = new Date()): PeriodInfo[] {
  const academic = getAcademicYearBounds(now);
  const semester = getCurrentSemester(now);
  const month = getMonthBounds(now);

  return [
    { id: "all", label: "الكل", description: "جميع البحوث المسجلة" },
    {
      id: "month",
      label: "هذا الشهر",
      description: `${month.month}/${month.year}`,
    },
    {
      id: "year",
      label: "هذه السنة",
      description: String(month.year),
    },
    {
      id: "academic",
      label: "العام الدراسي",
      description: academic.label,
    },
    {
      id: "semester",
      label: semester.label,
      description: `الفصل الحالي · ${academic.label}`,
    },
  ];
}

/** هل ينتمي البحث للفترة الزمنية (إدخال جديد أو نشر) */
export function researchMatchesPeriod(
  item: {
    year: number;
    publishMonth: number | null;
    publishStatus: string | null;
    createdAt: Date;
  },
  period: ResearchPeriod,
  now: Date = new Date()
): boolean {
  if (period === "all") return true;

  const created = new Date(item.createdAt);
  const { start: monthStart, end: monthEnd, month, year: calYear } = getMonthBounds(now);
  const { start: yearStart, end: yearEnd, year: currentYear } = getYearBounds(now);
  const academic = getAcademicYearBounds(now);
  const semester = getCurrentSemester(now);

  const createdInRange = (start: Date, end: Date) => created >= start && created <= end;

  const publishedInMonth =
    item.publishStatus === "PUBLISHED" &&
    item.publishMonth === month &&
    item.year === calYear;

  const publishedInYear =
    item.publishStatus === "PUBLISHED" && item.year === currentYear;

  const publishedInAcademic =
    item.publishStatus === "PUBLISHED" &&
    item.publishMonth != null &&
    ((item.year === academic.startYear && item.publishMonth >= 9) ||
      (item.year === academic.endYear && item.publishMonth <= 8));

  const publishedInSemester =
    item.publishStatus === "PUBLISHED" &&
    item.publishMonth != null &&
    semester.months.includes(item.publishMonth) &&
    (semester.months.includes(1)
      ? item.year === academic.startYear || item.year === academic.endYear
      : item.year === academic.endYear || item.year === academic.startYear);

  switch (period) {
    case "month":
      return createdInRange(monthStart, monthEnd) || publishedInMonth;
    case "year":
      return createdInRange(yearStart, yearEnd) || item.year === currentYear || publishedInYear;
    case "academic":
      return createdInRange(academic.start, academic.end) || publishedInAcademic;
    case "semester":
      return (
        (createdInRange(academic.start, academic.end) &&
          semester.months.includes(created.getMonth() + 1)) ||
        publishedInSemester
      );
    default:
      return true;
  }
}
