"use client";

import { useEffect, useState } from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyChartState } from "@/app/researcher/dashboard/_components/EmptyChartState";
import type { AcademicDegree } from "@prisma/client";

interface DegreesDistributionChartProps {
  degrees: AcademicDegree[];
}

const degreeLabels: Record<string, string> = {
  BACHELORS: "بكالوريوس",
  DIPLOMA: "دبلوم",
  HIGHER_DIPLOMA: "دبلوم عالي",
  MASTERS: "ماجستير",
  PHD: "دكتوراه",
  BOARD: "بورد",
};

const degreeColors: Record<string, string> = {
  BACHELORS: "#2563EB",      // أزرق
  DIPLOMA: "#10b981",        // أخضر
  HIGHER_DIPLOMA: "#f59e0b", // برتقالي
  MASTERS: "#8b5cf6",        // بنفسجي
  PHD: "#ef4444",            // أحمر
  BOARD: "#06b6d4",          // سماوي
};

export function DegreesDistributionChart({
  degrees,
}: DegreesDistributionChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // حساب التوزيع
  const distribution = degrees.reduce((acc, degree) => {
    const label = degreeLabels[degree.degree] || degree.degree;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // تحويل إلى مصفوفة للرسم البياني
  const chartData = Object.entries(distribution).map(([name, value]) => {
    const degreeType = Object.keys(degreeLabels).find(
      (key) => degreeLabels[key] === name
    ) || name;
    return {
      name,
      value,
      color: degreeColors[degreeType] || "#94a3b8",
    };
  });

  const totalDegrees = degrees.length;

  if (chartData.length === 0 || totalDegrees === 0) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 md:p-6">
        <CardHeader className="pb-3 px-0">
          <CardTitle className="text-base font-semibold text-gray-900">
            توزيع الشهادات حسب الدرجة
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <EmptyChartState type="pie" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 md:p-6">
      <CardHeader className="pb-4 px-0">
        <CardTitle className="text-base font-semibold text-gray-900">
          توزيع الشهادات حسب الدرجة
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* الرسم البياني */}
          <div style={{ height: "280px" }} className="relative">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value?: number) => {
                      const safeValue = typeof value === "number" ? value : 0;
                      return [`${safeValue} شهادة`, "العدد"];
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full" />
            )}
            {/* رقم إجمالي الشهادات في الوسط */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {totalDegrees}
                </div>
                <div className="text-xs text-slate-500 mt-1">إجمالي الشهادات</div>
              </div>
            </div>
          </div>

          {/* Chips Legend */}
          <div className="space-y-2.5">
            {chartData.map((item, index) => {
              const percentage = ((item.value / totalDegrees) * 100).toFixed(1);
              return (
                <div
                  key={index}
                  className="inline-flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 text-sm"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700 font-medium">{item.name}</span>
                  <span className="text-slate-600 font-semibold">
                    {item.value}
                  </span>
                  <span className="text-slate-500 text-xs">
                    ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
