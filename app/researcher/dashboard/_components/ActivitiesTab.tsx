"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Presentation,
  Users,
  GraduationCap,
  Wrench,
  ClipboardList,
  BookOpen,
  Award,
  FileText,
  UserCheck,
  Briefcase,
  Calendar,
  Heart,
} from "lucide-react";
import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";

interface ActivitiesTabProps {
  year: string;
  month: string;
}

const activityKPIs = [
  { label: "مؤتمرات", value: "24", icon: Presentation, color: "bg-blue-500" },
  { label: "ندوات", value: "18", icon: Users, color: "bg-green-500" },
  { label: "دورات", value: "12", icon: GraduationCap, color: "bg-purple-500" },
  { label: "ورش", value: "8", icon: Wrench, color: "bg-orange-500" },
  { label: "لجان", value: "15", icon: ClipboardList, color: "bg-indigo-500" },
  { label: "كتب شكر", value: "6", icon: BookOpen, color: "bg-pink-500" },
  { label: "شهادات مشاركة", value: "32", icon: Award, color: "bg-cyan-500" },
  { label: "إدارة مجلات", value: "4", icon: FileText, color: "bg-teal-500" },
  { label: "إشراف طلبة", value: "28", icon: UserCheck, color: "bg-amber-500" },
  { label: "مناصب", value: "7", icon: Briefcase, color: "bg-red-500" },
  { label: "تقويم علمي", value: "19", icon: Calendar, color: "bg-violet-500" },
  { label: "أعمال طوعية", value: "11", icon: Heart, color: "bg-rose-500" },
];

const activityByType = [
  { name: "مؤتمرات", عدد: 24 },
  { name: "ندوات", عدد: 18 },
  { name: "دورات", عدد: 12 },
  { name: "ورش", عدد: 8 },
  { name: "لجان", عدد: 15 },
  { name: "كتب شكر", عدد: 6 },
  { name: "شهادات", عدد: 32 },
  { name: "إدارة مجلات", عدد: 4 },
  { name: "إشراف", عدد: 28 },
  { name: "مناصب", عدد: 7 },
  { name: "تقويم", عدد: 19 },
  { name: "طوعية", عدد: 11 },
];

const monthlyActivities = [
  { name: "يناير", نشاطات: 8 },
  { name: "فبراير", نشاطات: 12 },
  { name: "مارس", نشاطات: 10 },
  { name: "أبريل", نشاطات: 15 },
  { name: "مايو", نشاطات: 9 },
  { name: "يونيو", نشاطات: 11 },
  { name: "يوليو", نشاطات: 7 },
  { name: "أغسطس", نشاطات: 13 },
  { name: "سبتمبر", نشاطات: 10 },
  { name: "أكتوبر", نشاطات: 14 },
  { name: "نوفمبر", نشاطات: 8 },
  { name: "ديسمبر", نشاطات: 12 },
];

export function ActivitiesTab({ year, month }: ActivitiesTabProps) {
  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {activityKPIs.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.label}
              className="border-slate-100 bg-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`${kpi.color} p-2 rounded-lg`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900 mb-1">{kpi.value}</div>
                <p className="text-xs text-slate-500 leading-tight">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">
              النشاطات حسب النوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={activityByType} dataKeys={["عدد"]} />
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">
              النشاطات الشهرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={monthlyActivities}
              dataKeys={[{ key: "نشاطات", stroke: "#2563EB" }]}
              showDots={true}
              gridOpacity={0.08}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
