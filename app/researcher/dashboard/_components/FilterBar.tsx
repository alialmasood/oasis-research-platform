"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Filter } from "lucide-react";

interface FilterBarProps {
  selectedYear: string;
  selectedMonth: string;
  onYearChange: (year: string) => void;
  onMonthChange: (month: string) => void;
  onApply: () => void;
}

const years = ["2022", "2023", "2024", "2025", "2026"];
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

export function FilterBar({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  onApply,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      <Filter className="h-5 w-5 text-gray-500" />
      <div className="flex items-center gap-2 flex-1">
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-[140px] h-9 border-gray-200">
            <SelectValue placeholder="السنة" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedMonth} onValueChange={onMonthChange}>
          <SelectTrigger className="w-[140px] h-9 border-gray-200">
            <SelectValue placeholder="الشهر" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={onApply}
        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-9 px-4"
      >
        تطبيق
      </Button>
    </div>
  );
}
