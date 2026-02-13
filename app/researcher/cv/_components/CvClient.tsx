"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, User, Languages, Code, Calendar, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
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
} from "recharts";
import { EmptyState } from "@/app/researcher/dashboard/_components/EmptyState";
import { EmptyChartState } from "@/app/researcher/dashboard/_components/EmptyChartState";
import { PersonalInfoCard } from "./PersonalInfoCard";
import { LanguagesDisplayCard } from "./LanguagesDisplayCard";
import { SkillsAndExperiencesDisplayCard } from "./SkillsAndExperiencesDisplayCard";
import type { ProfileCV, Language, Skill, Experience } from "@prisma/client";

interface CvClientProps {
  initialProfileCv: (ProfileCV & {
    languages: Language[];
    skills: Skill[];
    experiences: Experience[];
  }) | null;
}

const genderLabels: Record<string, string> = {
  MALE: "ذكر",
  FEMALE: "أنثى",
  OTHER: "آخر",
};

const languageLevelLabels: Record<string, string> = {
  BEGINNER: "مبتدئ",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدم",
  NATIVE: "طليق",
};

const languageLevelColors: Record<string, string> = {
  BEGINNER: "#3b82f6", // أزرق (أساسي)
  INTERMEDIATE: "#f59e0b", // برتقالي (متوسط)
  ADVANCED: "#10b981", // أخضر (إيجابي/مستوى)
  NATIVE: "#10b981", // أخضر (أعلى مستوى)
};

const skillLevelLabels: Record<string, string> = {
  LEVEL_1: "مبتدئ",
  LEVEL_2: "متوسط",
  LEVEL_3: "جيد",
  LEVEL_4: "متقدم",
  LEVEL_5: "خبير",
};

export function CvClient({ initialProfileCv }: CvClientProps) {
  const router = useRouter();
  const [profileCv, setProfileCv] = useState(initialProfileCv);
  const [mounted, setMounted] = useState(false);
  const hasData = profileCv !== null;

  useEffect(() => {
    const controller = new AbortController();
    const refreshProfile = async () => {
      const response = await fetch("/api/researcher/cv", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) return;
      const data = (await response.json()) as {
        profileCv:
          | (ProfileCV & {
              languages: Language[];
              skills: Skill[];
              experiences: Experience[];
            })
          | null;
      };
      if (data.profileCv) {
        setProfileCv(data.profileCv);
      }
    };
    refreshProfile().catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEdit = () => {
    router.push("/researcher/cv/edit");
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: Date | null | undefined): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(profileCv?.dateOfBirth);

  // Prepare language chart data
  const languageDistribution = profileCv?.languages.reduce((acc, lang) => {
    const label = languageLevelLabels[lang.level] || lang.level;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

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

  // Prepare skills chart data (by level)
  const skillDistribution = profileCv?.skills.reduce((acc, skill) => {
    const label = skillLevelLabels[skill.level] || skill.level;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const skillChartData = Object.entries(skillDistribution)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  // Sort experiences by date (descending)
  const sortedExperiences = profileCv?.experiences
    ? [...profileCv.experiences].sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return dateB - dateA;
      })
    : [];

  if (!hasData) {
    return (
      <div className="space-y-6">
        {/* Header - Sticky */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 pb-4 -mx-6 px-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">السيرة الذاتية</h1>
              <p className="text-sm text-gray-500 mt-1">ابدأ بإنشاء سيرتك الذاتية المختصرة</p>
            </div>
            <Button
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit className="h-4 w-4 ml-2" />
              تعديل السيرة الذاتية
            </Button>
          </div>
        </div>

        {/* Empty State */}
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-12">
            <EmptyState
              icon={User}
              title="لا توجد سيرة ذاتية"
              description="ابدأ بإنشاء سيرتك الذاتية المختصرة لإضافة معلوماتك الشخصية والمهارات والخبرات"
              actionLabel="إضافة السيرة الذاتية"
              onActionClick={handleEdit}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 pb-4 -mx-6 px-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">السيرة الذاتية</h1>
            <p className="text-sm text-gray-500 mt-1">عرض معلوماتك الشخصية والمهارات والخبرات</p>
          </div>
          <Button
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Edit className="h-4 w-4 ml-2" />
            تعديل السيرة الذاتية
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Gender */}
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">الجنس</p>
                <p className="text-sm font-semibold text-gray-900">
                  {profileCv.gender ? genderLabels[profileCv.gender] : "غير محدد"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Age */}
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">العمر</p>
                <p className="text-sm font-semibold text-gray-900">
                  {age !== null ? `${age} سنة` : "غير محدد"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Languages Count */}
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Languages className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">عدد اللغات</p>
                <p className="text-sm font-semibold text-gray-900">
                  {profileCv.languages.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills Count */}
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Code className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">عدد المهارات</p>
                <p className="text-sm font-semibold text-gray-900">
                  {profileCv.skills.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Experiences Count */}
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">عدد الخبرات</p>
                <p className="text-sm font-semibold text-gray-900">
                  {profileCv.experiences.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Cards - All Data */}
      <div className="space-y-6">
        {/* Personal Information & Languages Section */}
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">المعلومات الشخصية</h2>
            <h2 className="text-lg font-semibold text-gray-900">اللغات التي يتقنها الباحث ومستوى الإتقان</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PersonalInfoCard profileCv={profileCv} age={age} />
            <LanguagesDisplayCard languages={profileCv.languages} />
          </div>
        </div>

        {/* Skills and Experiences Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">المهارات والخبرات</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkillsAndExperiencesDisplayCard
              skills={profileCv.skills}
              experiences={profileCv.experiences}
            />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">تحليل المهارات واللغات</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Languages Donut Chart */}
          {profileCv.languages.length > 0 ? (
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">
                  توزيع مستويات اللغات
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                            {profileCv.languages.length}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">إجمالي اللغات</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {languageChartData.map((item, index) => {
                        const percentage = ((item.value / profileCv.languages.length) * 100).toFixed(1);
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
          ) : null}

          {/* Skills Bar Chart */}
          {profileCv.skills.length > 0 ? (
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">
                  مستويات المهارات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {skillChartData.length > 0 ? (
                  <div style={{ height: "280px" }}>
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
                        <BarChart data={skillChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.1} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                          axisLine={{ stroke: "#e5e7eb" }}
                          tickLine={{ stroke: "#e5e7eb" }}
                        />
                        <YAxis
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                          axisLine={{ stroke: "#e5e7eb" }}
                          tickLine={{ stroke: "#e5e7eb" }}
                        />
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
                            return [`${safeValue} مهارة`, "العدد"];
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
          ) : null}
        </div>
      </div>

      {/* Experiences Timeline */}
      {sortedExperiences.length > 0 && (
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">
              الخط الزمني للخبرات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedExperiences.map((exp, index) => {
                const startDate = new Date(exp.startDate);
                const endDate = exp.endDate ? new Date(exp.endDate) : null;
                
                // Determine experience type (static for now)
                const orgLower = exp.organization?.toLowerCase() || "";
                const titleLower = exp.title?.toLowerCase() || "";
                const isAcademic = 
                  orgLower.includes("جامعة") || 
                  orgLower.includes("كلية") || 
                  orgLower.includes("معهد") ||
                  titleLower.includes("أستاذ") ||
                  titleLower.includes("باحث") ||
                  titleLower.includes("مدرس");
                
                const experienceType = isAcademic ? "خبرة أكاديمية" : "خبرة مهنية";
                const experienceTypeColor = isAcademic 
                  ? "bg-green-100 text-green-700 border-green-200" 
                  : "bg-blue-100 text-blue-700 border-blue-200";
                
                return (
                  <div
                    key={exp.id}
                    className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                  >
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-2" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900">{exp.title}</h4>
                          <Badge
                            variant="outline"
                            className={`text-xs ${experienceTypeColor}`}
                          >
                            {experienceType}
                          </Badge>
                        </div>
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
