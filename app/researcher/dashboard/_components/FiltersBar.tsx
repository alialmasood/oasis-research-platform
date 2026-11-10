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

const typeLabels: Record<string, string> = {
  all: "الكل",
  research: "بحوث",
  activities: "نشاطات",
};

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
  const isAllYears = selectedYear === "all" || selectedYear === "";
  const yearLabel = isAllYears ? "الكل" : selectedYear;
  const monthLabel = months.find((m) => m.value === selectedMonth)?.label ?? "الكل";
  const monthOptions = [
    months[0],
    ...months.filter((m) => m.value !== "all" && availableMonths.includes(m.value)),
  ];

  return (
    <div className="w-full dashboard-filter-print">
      {/* هاتف: بطاقة فلاتر مع فواصل عمودية + ملخص الفترة */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-stretch">
            <div className="flex items-center justify-center px-2.5 bg-slate-50 border-l border-slate-200">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0 grid grid-cols-3 divide-x divide-x-reverse divide-slate-200">
              <div className="min-w-0 px-1.5 py-1.5">
                <p className="text-[9px] text-slate-500 mb-0.5 px-1">السنة</p>
                <Select
                  value={selectedYear || "all"}
                  onValueChange={onYearChange}
                  disabled={availableYears.length === 0}
                >
                  <SelectTrigger className="h-8 w-full min-w-0 px-1.5 text-[11px] border-0 bg-transparent shadow-none focus:ring-0">
                    <SelectValue placeholder="السنة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 px-1.5 py-1.5">
                <p className="text-[9px] text-slate-500 mb-0.5 px-1">الشهر</p>
                <Select
                  value={selectedMonth || "all"}
                  onValueChange={onMonthChange}
                  disabled={availableYears.length === 0 || isAllYears}
                >
                  <SelectTrigger className="h-8 w-full min-w-0 px-1.5 text-[11px] border-0 bg-transparent shadow-none focus:ring-0">
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
              </div>
              <div className="min-w-0 px-1.5 py-1.5">
                <p className="text-[9px] text-slate-500 mb-0.5 px-1">النوع</p>
                {onTypeChange ? (
                  <Select value={selectedType} onValueChange={onTypeChange}>
                    <SelectTrigger className="h-8 w-full min-w-0 px-1.5 text-[11px] border-0 bg-transparent shadow-none focus:ring-0">
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
                ) : (
                  <span className="block h-8 px-1.5 text-[11px] leading-8 text-slate-500">—</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-2.5 py-1.5">
            <span className="text-[10px] text-slate-500 truncate">
              الفترة: سنة {yearLabel} / {monthLabel}
              {onTypeChange ? ` · ${typeLabels[selectedType] ?? "الكل"}` : ""}
            </span>
            <FilterBadge
              year={selectedYear || "all"}
              month={selectedMonth || "all"}
              type={onTypeChange ? selectedType : undefined}
              compact
            />
          </div>
        </div>
      </div>

      {/* سطح المكتب: التخطيط الحالي */}
      <div className="hidden md:block w-full overflow-x-auto">
        <div className="flex items-center justify-between gap-2 min-w-max dashboard-filter-row">
          <div className="flex items-center gap-2 py-1.5 px-1 bg-gray-50 rounded-lg border border-gray-200 flex-shrink-0">
            <Calendar className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
            <Select
              value={selectedYear || "all"}
              onValueChange={onYearChange}
              disabled={availableYears.length === 0}
            >
              <SelectTrigger className="w-[120px] h-8 px-3 text-xs border-gray-200">
                <SelectValue placeholder="السنة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedMonth || "all"}
              onValueChange={onMonthChange}
              disabled={availableYears.length === 0 || isAllYears}
            >
              <SelectTrigger className="w-[120px] h-8 px-3 text-xs border-gray-200">
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
                <SelectTrigger className="w-[100px] h-8 px-3 text-xs border-gray-200">
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-600 whitespace-nowrap">
              الفترة: سنة {yearLabel} / {monthLabel}
              {onTypeChange ? ` · ${typeLabels[selectedType] ?? "الكل"}` : ""}
            </span>
            <FilterBadge year={selectedYear || "all"} month={selectedMonth || "all"} />
          </div>
        </div>
      </div>
    </div>
  );
}
