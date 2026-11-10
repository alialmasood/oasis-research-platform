"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Briefcase, Calendar } from "lucide-react";
import type { Skill, Experience } from "@prisma/client";

interface SkillsAndExperiencesDisplayCardProps {
  skills: Skill[];
  experiences: Experience[];
}

const skillLevelLabels: Record<string, string> = {
  LEVEL_1: "مبتدئ",
  LEVEL_2: "متوسط",
  LEVEL_3: "جيد",
  LEVEL_4: "متقدم",
  LEVEL_5: "خبير",
};

const skillLevelColors: Record<string, string> = {
  LEVEL_1: "bg-blue-100 text-blue-700 border-blue-200",
  LEVEL_2: "bg-orange-100 text-orange-700 border-orange-200",
  LEVEL_3: "bg-orange-100 text-orange-700 border-orange-200",
  LEVEL_4: "bg-green-100 text-green-700 border-green-200",
  LEVEL_5: "bg-green-100 text-green-700 border-green-200",
};

export function SkillsAndExperiencesDisplayCard({
  skills,
  experiences,
}: SkillsAndExperiencesDisplayCardProps) {
  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <Card className="rounded-xl md:rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2 gap-0 overflow-hidden">
      <CardHeader className="p-3 md:p-6 pb-2.5 md:pb-4">
        <CardTitle className="text-sm md:text-base font-semibold text-gray-900 flex items-center gap-2">
          <Code className="h-4 w-4 md:h-5 md:w-5 text-blue-600 shrink-0" />
          المهارات والخبرات
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-6 pt-0 space-y-4 md:space-y-6">
        {/* Skills */}
        <div>
          <h3 className="text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">المهارات</h3>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="inline-flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full border bg-white/70 text-[11px] md:text-sm max-w-full"
                >
                  <span className="font-medium text-gray-900 truncate">{skill.name}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] md:text-xs shrink-0 ${
                      skillLevelColors[skill.level] ||
                      "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {skillLevelLabels[skill.level] || skill.level}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-2">لا توجد مهارات مضافة</p>
          )}
        </div>

        {/* Experiences */}
        <div>
          <h3 className="text-xs md:text-sm font-medium text-gray-700 flex items-center gap-2 mb-2 md:mb-3">
            <Briefcase className="h-3.5 w-3.5 md:h-4 md:w-4" />
            الخبرات
          </h3>
          {experiences.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {experiences.map((experience) => {
                const orgLower = experience.organization?.toLowerCase() || "";
                const titleLower = experience.title?.toLowerCase() || "";
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
                    key={experience.id}
                    className="p-2.5 md:p-4 rounded-xl border border-slate-200 bg-slate-50/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 md:gap-2 mb-1 flex-wrap">
                        <h4 className="text-xs md:text-sm font-semibold text-gray-900">
                          {experience.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className={`text-[10px] md:text-xs ${experienceTypeColor}`}
                        >
                          {experienceType}
                        </Badge>
                      </div>
                      <p className="text-[11px] md:text-xs text-slate-600 mb-1.5 md:mb-2">
                        {experience.organization}
                      </p>
                      <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-slate-500">
                        <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0" />
                        <span>
                          {formatDate(experience.startDate)} -{" "}
                          {experience.endDate
                            ? formatDate(experience.endDate)
                            : "حتى الآن"}
                        </span>
                      </div>
                      {experience.description && (
                        <p className="text-[11px] md:text-xs text-slate-600 mt-1.5 md:mt-2 leading-relaxed">
                          {experience.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-2">لا توجد خبرات مضافة</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
