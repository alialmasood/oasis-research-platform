"use client";

import { Badge } from "@/components/ui/badge";
import { Sparkles, Calendar } from "lucide-react";
import { EmptyState } from "./EmptyState";

const typeLabels: Record<string, string> = {
  all: "الكل",
  research: "بحوث",
  activities: "نشاطات",
};

interface FilteredAcademicActivitiesProps {
  activities: Array<{
    label: string;
    value: string;
    icon: any;
    color: string;
  }>;
  year: string;
  month: string;
  type?: string;
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
  type = "all",
}: FilteredAcademicActivitiesProps) {
  const yearLabel = !year || year === "all" ? "الكل" : year;
  const monthLabel = monthNames[month] || "الكل";
  const typeLabel = typeLabels[type] || "الكل";

  return (
    <div className="bg-gradient-to-b from-indigo-50/90 via-white to-sky-50/60 md:bg-gradient-to-l md:from-blue-50/80 md:via-white md:to-indigo-50/70 border border-indigo-100/80 md:border-blue-100/70 shadow-none md:shadow-sm rounded-xl md:rounded-3xl p-3 md:p-6 overflow-hidden">
      <div className="mb-3 pb-2.5 md:mb-4 md:pb-3 border-b border-indigo-100/60 md:border-blue-100/40 space-y-1.5">
        <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between md:gap-2 md:flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="md:hidden flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            </span>
            <Sparkles className="hidden md:block h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
            <h3 className="text-sm md:text-base font-semibold text-gray-900 leading-snug">
              ملخص النشاطات الأكاديمية (حسب الفلتر)
            </h3>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto md:overflow-visible">
            <Badge className="shrink-0 bg-white text-indigo-700 border-indigo-200 px-2 py-0.5 text-[10px] md:text-xs font-medium h-6 md:hidden">
              {yearLabel}
            </Badge>
            <Badge className="shrink-0 bg-white text-sky-700 border-sky-200 px-2 py-0.5 text-[10px] font-medium h-6 md:hidden">
              {monthLabel}
            </Badge>
            <Badge className="shrink-0 bg-white text-violet-700 border-violet-200 px-2 py-0.5 text-[10px] font-medium h-6 md:hidden">
              {typeLabel}
            </Badge>
            <Badge className="hidden md:inline-flex w-auto justify-start bg-blue-100 text-blue-700 border-blue-200 px-2 py-1 text-xs font-medium h-auto min-h-6 whitespace-nowrap">
              سنة {yearLabel} • شهر: {monthLabel} • النوع: {typeLabel}
            </Badge>
          </div>
        </div>
        <p className="text-[11px] md:text-xs text-slate-500">
          يعرض نشاطاتك الأكاديمية ضمن الفترة المحددة.
        </p>
      </div>

      {activities.length === 0 || activities.every((a) => parseInt(a.value) === 0) ? (
        <EmptyState
          title="لا توجد نشاطات أكاديمية"
          description="لم يتم إضافة أي نشاطات أكاديمية في الفترة المحددة. جرب تغيير الفلتر أو أضف نشاط جديد."
          icon={Calendar}
          actionLabel="إضافة نشاط أكاديمي"
          actionHref="/researcher/activities"
        />
      ) : (
        <>
          {/* هاتف: شبكة بطاقات 2×N */}
          <div className="grid grid-cols-2 gap-2 md:hidden">
            {activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.label}
                  className="rounded-xl p-2.5 bg-white border border-slate-200/80 shadow-sm flex items-center gap-2 min-w-0 overflow-hidden"
                >
                  <div
                    className={`${activity.color} size-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="text-lg font-black text-gray-900 tabular-nums leading-none">
                      {activity.value}
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-600 leading-tight line-clamp-2">
                      {activity.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* سطح المكتب: التخطيط الحالي */}
          <div
            className="hidden md:grid gap-2 w-full"
            style={{
              gridTemplateRows: "repeat(2, auto)",
              gridAutoFlow: "column",
              gridAutoColumns: "1fr",
            }}
          >
            {activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.label}
                  className="rounded-lg p-2 bg-white/80 backdrop-blur border border-slate-200/70 shadow-sm flex items-center gap-1.5 min-w-0 hover:shadow-md transition-all duration-200 min-h-0"
                >
                  <div
                    className={`${activity.color} size-6 rounded-full flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="text-base font-semibold text-gray-900 leading-tight">
                      {activity.value}
                    </div>
                    <p className="text-xs text-slate-600 leading-tight line-clamp-2">
                      {activity.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
