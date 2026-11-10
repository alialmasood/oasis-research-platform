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

  const kpiItems = [
    {
      key: "gender",
      label: "الجنس",
      value: profileCv?.gender ? genderLabels[profileCv.gender] : "غير محدد",
      icon: User,
    },
    {
      key: "age",
      label: "العمر",
      value: age !== null ? `${age} سنة` : "غير محدد",
      icon: Calendar,
    },
    {
      key: "languages",
      label: "اللغات",
      value: String(profileCv?.languages.length ?? 0),
      icon: Languages,
    },
    {
      key: "skills",
      label: "المهارات",
      value: String(profileCv?.skills.length ?? 0),
      icon: Code,
    },
    {
      key: "experiences",
      label: "الخبرات",
      value: String(profileCv?.experiences.length ?? 0),
      icon: Briefcase,
    },
  ];

  if (!hasData) {
    return (
      <div className="space-y-3 md:space-y-6 min-w-0">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 pb-3 md:pb-4 -mx-4 px-4 pt-3 md:-mx-6 md:px-6 md:pt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-base md:text-2xl font-bold text-gray-900 truncate">السيرة الذاتية</h1>
              <p className="text-[11px] md:text-sm text-gray-500 mt-0.5 md:mt-1 line-clamp-1">
                ابدأ بإنشاء سيرتك الذاتية المختصرة
              </p>
            </div>
            <Button
              onClick={handleEdit}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 md:h-10 shrink-0 px-2.5 md:px-4 text-xs md:text-sm"
            >
              <Edit className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
              <span className="md:hidden">تعديل</span>
              <span className="hidden md:inline">تعديل السيرة الذاتية</span>
            </Button>
          </div>
        </div>

        <Card className="rounded-xl md:rounded-2xl border border-slate-200 bg-white shadow-sm gap-0">
          <CardContent className="p-6 md:p-12">
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
    <div className="space-y-3 md:space-y-6 min-w-0">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 pb-3 md:pb-4 -mx-4 px-4 pt-3 md:-mx-6 md:px-6 md:pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-base md:text-2xl font-bold text-gray-900 truncate">السيرة الذاتية</h1>
            <p className="text-[11px] md:text-sm text-gray-500 mt-0.5 md:mt-1 line-clamp-1">
              عرض معلوماتك الشخصية والمهارات والخبرات
            </p>
          </div>
          <Button
            onClick={handleEdit}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white h-8 md:h-10 shrink-0 px-2.5 md:px-4 text-xs md:text-sm"
          >
            <Edit className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
            <span className="md:hidden">تعديل</span>
            <span className="hidden md:inline">تعديل السيرة الذاتية</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards — موبايل: شبكة مضغوطة 2 أعمدة */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-2 md:gap-4">
        {kpiItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.key}
              className={`rounded-xl md:rounded-2xl border border-slate-200 bg-white shadow-sm gap-0 overflow-hidden ${
                index === kpiItems.length - 1 ? "col-span-2 md:col-span-1 lg:col-span-1" : ""
              }`}
            >
              <CardContent className="p-2.5 md:p-4">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="p-1.5 md:p-2 rounded-lg bg-blue-50 shrink-0">
                    <Icon className="h-3.5 w-3.5 md:h-5 md:w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs text-slate-500 mb-0.5 md:mb-1 truncate">
                      {item.label}
                    </p>
                    <p className="text-xs md:text-sm font-semibold text-gray-900 truncate">
                      {item.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Cards */}
      <div className="space-y-3 md:space-y-6">
        <div>
          {/* عناوين الأقسام تظهر على الحاسوب فقط؛ الموبايل يعتمد عناوين البطاقات */}
          <div className="hidden lg:grid grid-cols-12 gap-6 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 col-span-7">
              المعلومات الشخصية
            </h2>
            <h2 className="text-lg font-semibold text-gray-900 col-span-5">
              اللغات ومستوى الإتقان
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6 items-stretch">
            <div className="lg:col-span-7 min-w-0">
              <PersonalInfoCard profileCv={profileCv} age={age} />
            </div>
            <div className="lg:col-span-5 min-w-0">
              <LanguagesDisplayCard languages={profileCv.languages} />
            </div>
          </div>
        </div>

        <div>
          <h2 className="hidden md:block text-lg font-semibold text-gray-900 mb-4">
            المهارات والخبرات
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
            <SkillsAndExperiencesDisplayCard
              skills={profileCv.skills}
              experiences={profileCv.experiences}
            />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div>
        <h2 className="text-sm md:text-lg font-semibold text-gray-900 mb-2.5 md:mb-4">
          تحليل المهارات واللغات
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
          {profileCv.languages.length > 0 ? (
            <Card className="rounded-xl md:rounded-2xl border border-slate-200 bg-white shadow-sm gap-0 overflow-hidden">
              <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
                <CardTitle className="text-sm md:text-base font-semibold text-gray-900">
                  توزيع مستويات اللغات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                {languageChartData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 items-center">
                    <div className="h-[200px] md:h-[280px] relative">
                      {mounted ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
                          <RechartsPieChart>
                          <Pie
                            data={languageChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={84}
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
                          <div className="text-2xl md:text-3xl font-bold text-gray-900">
                            {profileCv.languages.length}
                          </div>
                          <div className="text-[10px] md:text-xs text-slate-500 mt-0.5 md:mt-1">
                            إجمالي اللغات
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 md:block md:space-y-2.5">
                      {languageChartData.map((item, index) => {
                        const percentage = ((item.value / profileCv.languages.length) * 100).toFixed(1);
                        return (
                          <div
                            key={index}
                            className="inline-flex items-center gap-1.5 md:gap-2.5 px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-slate-200 bg-slate-50/50 text-[11px] md:text-sm"
                          >
                            <div
                              className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-gray-700 font-medium">{item.name}</span>
                            <span className="text-slate-600 font-semibold">{item.value}</span>
                            <span className="text-slate-500 text-[10px] md:text-xs">({percentage}%)</span>
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

          {profileCv.skills.length > 0 ? (
            <Card className="rounded-xl md:rounded-2xl border border-slate-200 bg-white shadow-sm gap-0 overflow-hidden">
              <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
                <CardTitle className="text-sm md:text-base font-semibold text-gray-900">
                  مستويات المهارات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                {skillChartData.length > 0 ? (
                  <div className="h-[200px] md:h-[280px]">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
                        <BarChart data={skillChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.1} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#6b7280", fontSize: 11 }}
                          axisLine={{ stroke: "#e5e7eb" }}
                          tickLine={{ stroke: "#e5e7eb" }}
                        />
                        <YAxis
                          tick={{ fill: "#6b7280", fontSize: 11 }}
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
        <Card className="rounded-xl md:rounded-2xl border border-slate-200 bg-white shadow-sm gap-0 overflow-hidden">
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
            <CardTitle className="text-sm md:text-base font-semibold text-gray-900">
              الخط الزمني للخبرات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="space-y-3 md:space-y-4">
              {sortedExperiences.map((exp) => {
                const startDate = new Date(exp.startDate);
                const endDate = exp.endDate ? new Date(exp.endDate) : null;
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
                    className="flex items-start gap-2.5 md:gap-4 pb-3 md:pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                  >
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-1.5 md:mt-2" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <h4 className="text-xs md:text-sm font-semibold text-gray-900">
                            {exp.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-[10px] md:text-xs ${experienceTypeColor}`}
                          >
                            {experienceType}
                          </Badge>
                        </div>
                        <span className="text-[10px] md:text-xs text-slate-500 shrink-0">
                          {startDate.getFullYear()} - {endDate ? endDate.getFullYear() : "حتى الآن"}
                        </span>
                      </div>
                      <p className="text-[11px] md:text-xs text-slate-600 mb-0.5 md:mb-1">
                        {exp.organization}
                      </p>
                      {exp.description && (
                        <p className="text-[11px] md:text-xs text-slate-500 leading-relaxed">
                          {exp.description}
                        </p>
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
