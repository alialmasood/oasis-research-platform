"use client";

import { Badge } from "@/components/ui/badge";

interface FilterBadgeProps {
  year: string;
  month: string;
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

export function FilterBadge({ year, month }: FilterBadgeProps) {
  const monthLabel = monthNames[month] || "الكل";
  return (
    <Badge className="h-8 px-3 text-xs font-medium bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20 inline-flex items-center">
      مفلتر: {year} / {monthLabel}
    </Badge>
  );
}
