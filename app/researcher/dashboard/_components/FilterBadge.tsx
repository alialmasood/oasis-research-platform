"use client";

import { Badge } from "@/components/ui/badge";

interface FilterBadgeProps {
  year: string;
  month: string;
  type?: string;
  compact?: boolean;
}

const monthNames: Record<string, string> = {
  all: "الكل",
  "1": "يناير",
  "2": "فبراير",
  "3": "مارس",
  "4": "أبريل",
  "5": "مايو",
  "6": "يونيو",
  "7": "يوليو",
  "8": "أغسطس",
  "9": "سبتمبر",
  "10": "أكتوبر",
  "11": "نوفمبر",
  "12": "ديسمبر",
};

const typeLabels: Record<string, string> = {
  all: "الكل",
  research: "بحوث",
  activities: "نشاطات",
};

export function FilterBadge({ year, month, type, compact = false }: FilterBadgeProps) {
  const yearLabel = !year || year === "all" ? "الكل" : year;
  const monthLabel = monthNames[month] || "الكل";
  const typeLabel = type ? typeLabels[type] ?? "الكل" : null;

  if (compact) {
    return (
      <Badge className="h-6 shrink-0 justify-center px-2 text-[10px] font-semibold bg-blue-600 text-white border-0 inline-flex items-center">
        مفلتر: {yearLabel} / {monthLabel}
        {typeLabel ? ` / ${typeLabel}` : ""}
      </Badge>
    );
  }

  return (
    <Badge className="h-8 px-3 text-xs font-medium bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20 inline-flex items-center">
      مفلتر: {yearLabel} / {monthLabel}
    </Badge>
  );
}
