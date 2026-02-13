"use client";

import { useEffect, useState } from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyChartState } from "@/app/researcher/dashboard/_components/EmptyChartState";
import type { Language, Skill, Experience } from "@prisma/client";

interface CvInsightsProps {
  languages: Language[];
  skills: Skill[];
  experiences: Experience[];
}

const languageLevelLabels: Record<string, string> = {
  BEGINNER: "مبتدئ",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدم",
  NATIVE: "طليق",
};

const languageLevelColors: Record<string, string> = {
  BEGINNER: "#3b82f6",
  INTERMEDIATE: "#10b981",
  ADVANCED: "#8b5cf6",
  NATIVE: "#f59e0b",
};

const skillLevelLabels: Record<string, string> = {
  LEVEL_1: "مبتدئ",
  LEVEL_2: "متوسط",
  LEVEL_3: "جيد",
  LEVEL_4: "متقدم",
  LEVEL_5: "خبير",
};

export function CvInsights({ languages, skills, experiences }: CvInsightsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Languages Distribution
  const languageDistribution = languages.reduce((acc, lang) => {
    const label = languageLevelLabels[lang.level] || lang.level;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const languageChartData = Object.entries(languageDistribution).map(([name, value]) => {
    const level = Object.keys(languageLevelLabels).find(
      (key) => languageLevelLabels[key] === name
    ) || name;
    return {
      name,
      value,
      color: languageLevelColors[level] || "#94a3b8",
    };
  });

  // Skills Distribution (by level)
  const skillDistribution = skills.reduce((acc, skill) => {
    const label = skillLevelLabels[skill.level] || skill.level;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const skillChartData = Object.entries(skillDistribution)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  // Top Skills by name
  const topSkills = skills.reduce((acc, skill) => {
    acc[skill.name] = (acc[skill.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSkillsData = Object.entries(topSkills)
    .map(([name, value]) => ({
      name: name.length > 15 ? name.substring(0, 15) + "..." : name,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Insights</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Languages Distribution Chart */}
        {languages.length > 0 && (
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 md:p-6">
            <CardHeader className="pb-4 px-0">
              <CardTitle className="text-base font-semibold text-gray-900">
                توزيع مستويات اللغات
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {languageChartData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div style={{ height: "280px" }} className="relative">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
                        <RechartsPieChart>
                        <Pie
                          data={languageChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {languageChartData.map((entry, index) => (
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
                            return [`${safeValue} لغة`, "العدد"];
                          }}
                        />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {languages.length}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">إجمالي اللغات</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {languageChartData.map((item, index) => {
                      const percentage = ((item.value / languages.length) * 100).toFixed(1);
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
                          <span className="text-slate-600 font-semibold">{item.value}</span>
                          <span className="text-slate-500 text-xs">({percentage}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <EmptyChartState type="pie" />
              )}
            </CardContent>
          </Card>
        )}

        {/* Skills Distribution Chart */}
        {skills.length > 0 && (
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 md:p-6">
            <CardHeader className="pb-4 px-0">
              <CardTitle className="text-base font-semibold text-gray-900">
                توزيع المهارات
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {topSkillsData.length > 0 ? (
                <div style={{ height: "280px" }}>
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
                      <BarChart data={topSkillsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
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
                          return [`${safeValue}`, "العدد"];
                        }}
                      />
                      <Bar dataKey="value" fill="#2563EB" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
              ) : (
                <EmptyChartState type="bar" />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Experiences Timeline (Simple List) */}
      {experiences.length > 0 && (
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 md:p-6">
          <CardHeader className="pb-4 px-0">
            <CardTitle className="text-base font-semibold text-gray-900">
              الخط الزمني للخبرات
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-4">
              {experiences.map((exp, index) => {
                const startDate = new Date(exp.startDate);
                const endDate = exp.endDate ? new Date(exp.endDate) : null;
                return (
                  <div
                    key={exp.id}
                    className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                  >
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-2" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">{exp.title}</h4>
                        <span className="text-xs text-slate-500">
                          {startDate.getFullYear()} - {endDate ? endDate.getFullYear() : "حتى الآن"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-1">{exp.organization}</p>
                      {exp.description && (
                        <p className="text-xs text-slate-500 leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
