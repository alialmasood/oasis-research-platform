"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { FilterBadge } from "./FilterBadge";

interface FiltersBarProps {
  selectedYear: string;
  selectedMonth: string;
  availableYears: string[];
  availableMonths: string[];
  selectedType?: string;
  onYearChange: (year: string) => void;
  onMonthChange: (month: string) => void;
  onTypeChange?: (type: string) => void;
}

const months = [
  { value: "all", label: "الكل" },
  { value: "1", label: "يناير" },
  { value: "2", label: "فبراير" },
  { value: "3", label: "مارس" },
  { value: "4", label: "أبريل" },
  { value: "5", label: "مايو" },
  { value: "6", label: "يونيو" },
  { value: "7", label: "يوليو" },
  { value: "8", label: "أغسطس" },
  { value: "9", label: "سبتمبر" },
  { value: "10", label: "أكتوبر" },
  { value: "11", label: "نوفمبر" },
  { value: "12", label: "ديسمبر" },
];

const types = [
  { value: "all", label: "الكل" },
  { value: "research", label: "بحوث" },
  { value: "activities", label: "نشاطات" },
];

export function FiltersBar({
  selectedYear,
  selectedMonth,
  availableYears,
  availableMonths,
  selectedType = "all",
  onYearChange,
  onMonthChange,
  onTypeChange,
}: FiltersBarProps) {

  const monthLabel = months.find((m) => m.value === selectedMonth)?.label ?? "الكل";
  const monthOptions = [
    months[0],
    ...months.filter((m) => m.value !== "all" && availableMonths.includes(m.value)),
  ];

  return (
    <div className="w-full overflow-x-auto dashboard-filter-print">
      <div className="flex items-center justify-between gap-2 min-w-max dashboard-filter-row">
        {/* الفلاتر - يمين في RTL */}
        <div className="flex items-center gap-2 py-1.5 px-1 bg-gray-50 rounded-lg border border-gray-200 flex-shrink-0">
          <Calendar className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
          <Select value={selectedYear} onValueChange={onYearChange} disabled={availableYears.length === 0}>
            <SelectTrigger className="w-[100px] md:w-[120px] h-8 px-3 text-xs border-gray-200">
              <SelectValue placeholder="السنة" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={onMonthChange} disabled={availableYears.length === 0}>
            <SelectTrigger className="w-[100px] md:w-[120px] h-8 px-3 text-xs border-gray-200">
              <SelectValue placeholder="الشهر" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onTypeChange && (
            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger className="w-[90px] md:w-[100px] h-8 px-3 text-xs border-gray-200">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {/* عام / تفصيلي / مفلتر - يسار في RTL */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-600 whitespace-nowrap">عام: كل السنوات</span>
          <span className="text-xs text-slate-600 whitespace-nowrap">
            تفصيلي: سنة {selectedYear} / {monthLabel}
          </span>
          <FilterBadge year={selectedYear} month={selectedMonth} />
        </div>
      </div>
    </div>
  );
}
