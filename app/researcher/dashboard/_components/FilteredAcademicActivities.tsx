"use client";

import { Badge } from "@/components/ui/badge";
import { Sparkles, Calendar } from "lucide-react";
import { EmptyState } from "./EmptyState";

interface FilteredAcademicActivitiesProps {
  activities: Array<{
    label: string;
    value: string;
    icon: any;
    color: string;
  }>;
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

export function FilteredAcademicActivities({
  activities,
  year,
  month,
}: FilteredAcademicActivitiesProps) {
  const monthLabel = monthNames[month] || "الكل";

  return (
    <div className="bg-gradient-to-l from-blue-50/60 via-white to-indigo-50/60 border border-blue-100/60 shadow-sm rounded-3xl p-3 md:p-6">
      {/* Header: سطرين - عنوان ثم وصف */}
      <div className="mb-3 pb-2 md:mb-4 md:pb-3 border-b border-blue-100/40 space-y-0.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
            <h3 className="text-sm md:text-base font-semibold text-gray-900">
              ملخص النشاطات الأكاديمية (حسب الفلتر)
            </h3>
          </div>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-2 py-0.5 text-[10px] md:text-xs font-medium h-6">
            سنة {year} • شهر: {monthLabel} • النوع: الكل
          </Badge>
        </div>
        <p className="text-[11px] md:text-xs text-slate-500">
          يعرض نشاطاتك الأكاديمية ضمن الفترة المحددة.
        </p>
      </div>

      {/* Mini Stat Pills */}
      {activities.length === 0 || activities.every((a) => parseInt(a.value) === 0) ? (
        <EmptyState
          title="لا توجد نشاطات أكاديمية"
          description="لم يتم إضافة أي نشاطات أكاديمية في الفترة المحددة. جرب تغيير الفلتر أو أضف نشاط جديد."
          icon={Calendar}
          actionLabel="إضافة نشاط أكاديمي"
          actionHref="/researcher/activities"
        />
      ) : (
        <div
          className="grid gap-1.5 md:gap-2 w-full"
          style={{ gridTemplateRows: "repeat(2, auto)", gridAutoFlow: "column", gridAutoColumns: "1fr" }}
        >
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.label}
                className="rounded-lg p-1.5 md:p-2 bg-white/80 backdrop-blur border border-slate-200/70 shadow-sm flex items-center gap-1.5 min-w-0 hover:shadow-md transition-all duration-200 min-h-0"
              >
                <div className={`${activity.color} size-5 md:size-6 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <Icon className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="text-sm md:text-base font-semibold text-gray-900 leading-tight">{activity.value}</div>
                  <p className="text-[10px] md:text-xs text-slate-600 leading-tight line-clamp-2">{activity.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
