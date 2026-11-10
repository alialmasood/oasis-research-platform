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

function ActivityCard({
  activity,
}: {
  activity: AcademicActivitiesGridProps["activities"][number];
}) {
  const Icon = activity.icon;
  return (
    <div className="rounded-xl p-2.5 flex items-center gap-2 bg-slate-50/60 border border-slate-100 min-w-0">
      <div
        className={`${activity.color} size-8 rounded-lg flex items-center justify-center flex-shrink-0`}
      >
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-bold text-gray-900 tabular-nums leading-none">
          {activity.value}
        </div>
        <p className="mt-0.5 text-[10px] text-slate-500 leading-tight line-clamp-2">
          {activity.label}
        </p>
      </div>
    </div>
  );
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
    <div className="bg-transparent md:bg-white border-0 md:border md:border-gray-200 rounded-none md:rounded-lg p-0 md:p-6 shadow-none md:shadow-sm">
      {/* هاتف: شبكة بطاقات 2×N */}
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {activities.map((activity) => (
          <ActivityCard key={activity.label} activity={activity} />
        ))}
      </div>

      {/* سطح المكتب: التخطيط الحالي بدون تغيير */}
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
              className="rounded-xl p-4 flex items-center gap-1.5 bg-white shadow-sm border border-slate-100 min-w-0"
            >
              <div
                className={`${activity.color} size-8 rounded-full flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xl font-semibold text-gray-900">{activity.value}</div>
                <p className="text-sm text-slate-500 leading-tight line-clamp-2">
                  {activity.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
