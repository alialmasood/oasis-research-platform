"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  CheckCircle2,
  FileCheck,
  XCircle,
  Globe,
  MapPin,
  User,
  Users,
  Database,
  Award,
} from "lucide-react";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { LineChart } from "@/components/charts/line-chart";

interface ResearchTabProps {
  year: string;
  month: string;
}

const researchKPIs = [
  { label: "إجمالي البحوث", value: "45", icon: BookOpen, color: "bg-blue-500" },
  { label: "البحوث المخططة", value: "12", icon: FileCheck, color: "bg-yellow-500" },
  { label: "البحوث المنجزة", value: "28", icon: CheckCircle2, color: "bg-green-500" },
  { label: "البحوث المنشورة", value: "22", icon: Award, color: "bg-purple-500" },
  { label: "البحوث غير المنجزة", value: "5", icon: XCircle, color: "bg-red-500" },
  { label: "البحوث العالمية", value: "18", icon: Globe, color: "bg-indigo-500" },
  { label: "البحوث المحلية", value: "27", icon: MapPin, color: "bg-orange-500" },
  { label: "بحوث فردية", value: "15", icon: User, color: "bg-teal-500" },
  { label: "بحوث مشتركة", value: "30", icon: Users, color: "bg-pink-500" },
  { label: "Scopus", value: "14", icon: Database, color: "bg-cyan-500" },
  { label: "Thomson Reuters", value: "8", icon: Database, color: "bg-amber-500" },
];

const yearlyData = [
  { name: "2022", مخطط: 5, منجز: 3, منشور: 2, "غير منجز": 2 },
  { name: "2023", مخطط: 8, منجز: 6, منشور: 5, "غير منجز": 2 },
  { name: "2024", مخطط: 12, منجز: 10, منشور: 8, "غير منجز": 2 },
  { name: "2025", مخطط: 15, منجز: 9, منشور: 7, "غير منجز": 6 },
];

const indexingDistribution = [
  { name: "Scopus", value: 14, color: "#2563EB" },
  { name: "Thomson Reuters", value: 8, color: "#10b981" },
  { name: "غير مفهرس", value: 23, color: "#94a3b8" },
];

const monthlyActivity = [
  { name: "يناير", بحوث: 2 },
  { name: "فبراير", بحوث: 3 },
  { name: "مارس", بحوث: 4 },
  { name: "أبريل", بحوث: 2 },
  { name: "مايو", بحوث: 5 },
  { name: "يونيو", بحوث: 3 },
  { name: "يوليو", بحوث: 4 },
  { name: "أغسطس", بحوث: 2 },
  { name: "سبتمبر", بحوث: 3 },
  { name: "أكتوبر", بحوث: 4 },
  { name: "نوفمبر", بحوث: 2 },
  { name: "ديسمبر", بحوث: 3 },
];

export function ResearchTab({ year, month }: ResearchTabProps) {
  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {researchKPIs.map((kpi) => {
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
              حالة البحوث حسب السنوات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={yearlyData}
              dataKeys={["مخطط", "منجز", "منشور", "غير منجز"]}
              stackId="research"
              colors={["#fbbf24", "#10b981", "#2563EB", "#ef4444"]}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">
              توزيع الفهرسة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={indexingDistribution} />
          </CardContent>
        </Card>
      </div>

      {/* Monthly Activity */}
      <Card className="border-slate-100 bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900">
            النشاط الشهري
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={monthlyActivity}
            dataKeys={[{ key: "بحوث", stroke: "#2563EB" }]}
            showDots={true}
            gridOpacity={0.08}
          />
        </CardContent>
      </Card>
    </div>
  );
}
