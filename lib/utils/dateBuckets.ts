import {
  addMonths,
  addYears,
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
} from "date-fns";

export type Granularity = "month" | "year";

export type DateBucket = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

export function buildBuckets(from: Date, to: Date, granularity: Granularity): DateBucket[] {
  const buckets: DateBucket[] = [];
  let cursor = granularity === "month" ? startOfMonth(from) : startOfYear(from);
  const end = granularity === "month" ? endOfMonth(to) : endOfYear(to);

  while (cursor <= end) {
    const start = granularity === "month" ? startOfMonth(cursor) : startOfYear(cursor);
    const finish = granularity === "month" ? endOfMonth(cursor) : endOfYear(cursor);
    const key = granularity === "month" ? format(start, "yyyy-MM") : format(start, "yyyy");
    const label = granularity === "month" ? format(start, "MM/yyyy") : format(start, "yyyy");
    buckets.push({ key, label, start, end: finish });
    cursor = granularity === "month" ? addMonths(cursor, 1) : addYears(cursor, 1);
  }

  return buckets;
}
