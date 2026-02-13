"use client";

import { EmptyState } from "./EmptyState";
import { Calendar } from "lucide-react";

interface AcademicActivitiesGridProps {
  activities: Array<{
    label: string;
    value: string;
    icon: any;
    color: string;
  }>;
}

export function AcademicActivitiesGrid({ activities }: AcademicActivitiesGridProps) {
  const hasData = activities.some((activity) => parseInt(activity.value) > 0);

  if (!hasData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-6 shadow-sm">
        <EmptyState
          title="لا توجد نشاطات أكاديمية"
          description="لم يتم إضافة أي نشاطات أكاديمية بعد. ابدأ بإضافة أول نشاط لك."
          icon={Calendar}
          actionLabel="إضافة نشاط أكاديمي"
          actionHref="/researcher/activities"
        />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-6 shadow-sm">
      <div
        className="grid gap-2 w-full"
        style={{ gridTemplateRows: "repeat(2, auto)", gridAutoFlow: "column", gridAutoColumns: "1fr" }}
      >
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div
              key={activity.label}
              className="rounded-xl p-2 md:p-4 flex items-center gap-1.5 bg-white shadow-sm border border-slate-100 min-w-0"
            >
              <div className={`${activity.color} size-6 md:size-8 rounded-full flex items-center justify-center flex-shrink-0`}>
                <Icon className="h-3 w-3 md:h-3.5 md:w-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base md:text-xl font-semibold text-gray-900">{activity.value}</div>
                <p className="text-[11px] md:text-sm text-slate-500 leading-tight line-clamp-2">{activity.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
