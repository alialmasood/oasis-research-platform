"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "./EmptyState";
import {
  BookOpen,
  Users,
  Award,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Presentation,
  GraduationCap,
  ClipboardList,
  Briefcase,
  Heart,
  MapPin,
  UserCheck,
} from "lucide-react";
import { onDashboardUpdate } from "@/lib/dashboardSync";
import type { TimelineActivity } from "@/lib/recentActivities";

interface ActivityTimelineProps {
  initialActivities: TimelineActivity[];
}

const typeConfig: Record<
  string,
  { icon: any; label: string; color: string; bgColor: string; borderColor: string }
> = {
  research: {
    icon: BookOpen,
    label: "بحث",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  conference: {
    icon: Users,
    label: "مؤتمر",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  thankYou: {
    icon: Award,
    label: "شكر",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  committee: {
    icon: FileText,
    label: "لجنة",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  workshop: {
    icon: Calendar,
    label: "ورشة",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  publication: {
    icon: FileCheck,
    label: "نشر",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  seminar: {
    icon: Presentation,
    label: "ندوة",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  course: {
    icon: GraduationCap,
    label: "دورة",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  assignment: {
    icon: ClipboardList,
    label: "تكليف",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  certificate: {
    icon: Award,
    label: "شهادة",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  journal: {
    icon: FileText,
    label: "مجلة",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
  },
  supervision: {
    icon: UserCheck,
    label: "إشراف",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  reviewing: {
    icon: FileText,
    label: "تقويم",
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
  },
  position: {
    icon: Briefcase,
    label: "منصب",
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
  },
  volunteering: {
    icon: Heart,
    label: "طوعي",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
  },
  fieldVisit: {
    icon: MapPin,
    label: "زيارة",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
  },
};

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  completed: {
    label: "منجز",
    icon: CheckCircle2,
    color: "text-green-600",
  },
  published: {
    label: "منشور",
    icon: FileCheck,
    color: "text-blue-600",
  },
  planned: {
    label: "مخطط",
    icon: Clock,
    color: "text-amber-600",
  },
};

export function ActivityTimeline({ initialActivities }: ActivityTimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activities, setActivities] = useState<TimelineActivity[]>(initialActivities);

  const loadActivities = async () => {
    const response = await fetch("/api/researcher/dashboard/recent-activities", {
      cache: "no-store",
    });
    if (!response.ok) return;
    const data = (await response.json()) as { activities?: TimelineActivity[] };
    if (data.activities) setActivities(data.activities);
  };

  useEffect(() => {
    loadActivities().catch(() => undefined);
  }, []);

  useEffect(() => {
    return onDashboardUpdate(() => {
      loadActivities().catch(() => undefined);
    });
  }, []);

  // Filter activities by status
  const filteredActivities = activities.filter((activity) => {
    if (statusFilter === "all") return true;
    return activity.status === statusFilter;
  });

  const displayedActivities = showAll
    ? filteredActivities
    : filteredActivities.slice(0, 6);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const statusOptions = [
    { value: "all", label: "الكل" },
    { value: "published", label: "منشور" },
    { value: "completed", label: "منجز" },
    { value: "planned", label: "قيد التنفيذ" },
  ];

  return (
    <Card className="border-0 md:border md:border-slate-100 bg-white/80 md:bg-white shadow-none md:shadow-lg overflow-hidden rounded-xl md:rounded-xl">
      <CardHeader className="pb-2 p-3 md:p-6 pt-3 md:pt-6">
        <div className="flex flex-row items-center justify-between gap-2 md:gap-4">
          <CardTitle className="text-sm md:text-xl font-semibold text-gray-900 shrink-0">
            آخر النشاطات
          </CardTitle>
          <div className="flex items-center gap-1.5 min-w-0 md:gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[7.5rem] md:w-[140px] h-8 md:h-9 text-[11px] md:text-sm border-gray-200 px-2">
                <SelectValue placeholder="فلتر الحالة" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowAll(!showAll)}
              variant="outline"
              className="h-8 md:h-9 px-2.5 md:px-4 text-[11px] md:text-sm border-gray-200 text-gray-700 hover:bg-gray-50 whitespace-nowrap shrink-0"
            >
              <span className="md:hidden">{showAll ? "أقل" : "الكل"}</span>
              <span className="hidden md:inline">{showAll ? "عرض أقل" : "عرض الكل"}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
        {filteredActivities.length === 0 ? (
          <EmptyState
            title="لا توجد نشاطات"
            description="لا توجد نشاطات متطابقة مع الفلتر المحدد. جرب تغيير الفلتر أو أضف نشاط جديد."
            icon={Calendar}
          />
        ) : (
          <div className="relative">
            <div className="absolute right-4 md:right-6 top-0 bottom-0 w-0.5 bg-slate-200" />

            <div className="space-y-2.5 md:space-y-4">
              {displayedActivities.map((activity) => {
                const typeInfo = typeConfig[activity.type];
                const statusInfo = statusConfig[activity.status];
                const TypeIcon = typeInfo.icon;
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={activity.id}
                    className="relative flex items-start gap-2.5 md:gap-4"
                  >
                    <div className="relative z-10 flex-shrink-0">
                      <div
                        className={`h-8 w-8 md:h-12 md:w-12 rounded-full ${typeInfo.bgColor} ${typeInfo.borderColor} border-2 flex items-center justify-center`}
                      >
                        <TypeIcon className={`h-3.5 w-3.5 md:h-5 md:w-5 ${typeInfo.color}`} />
                      </div>
                    </div>
                    <div className="flex-1 pt-0.5 min-w-0 rounded-xl border border-slate-100 bg-slate-50/40 p-2.5 md:rounded-none md:border-0 md:bg-transparent md:p-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <Badge
                          className={`h-5 px-1.5 md:px-2 text-[10px] md:text-xs ${typeInfo.bgColor} ${typeInfo.color} ${typeInfo.borderColor} border`}
                        >
                          {typeInfo.label}
                        </Badge>
                        <Badge className="h-5 px-1.5 md:px-2 text-[10px] md:text-xs bg-slate-100 text-slate-700 border-slate-200">
                          <StatusIcon className={`h-3 w-3 ${statusInfo.color} ml-1`} />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <h4 className="text-xs md:text-sm font-medium text-gray-900 mb-0.5 leading-snug line-clamp-2">
                        {activity.title}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-500">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span className="truncate">{formatDate(activity.date)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
