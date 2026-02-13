"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Briefcase, Plus, X, Calendar } from "lucide-react";
import { SkillDialog } from "./SkillDialog";
import { ExperienceDialog } from "./ExperienceDialog";
import { deleteSkill, deleteExperience } from "../_actions";
import type { Skill, Experience } from "@prisma/client";

interface SkillsAndExperiencesCardProps {
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
  LEVEL_2: "bg-green-100 text-green-700 border-green-200",
  LEVEL_3: "bg-yellow-100 text-yellow-700 border-yellow-200",
  LEVEL_4: "bg-orange-100 text-orange-700 border-orange-200",
  LEVEL_5: "bg-red-100 text-red-700 border-red-200",
};

export function SkillsAndExperiencesCard({
  skills,
  experiences,
}: SkillsAndExperiencesCardProps) {
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenSkillDialog = (skill?: Skill) => {
    setEditingSkill(skill || null);
    setIsSkillDialogOpen(true);
  };

  const handleCloseSkillDialog = () => {
    setIsSkillDialogOpen(false);
    setEditingSkill(null);
  };

  const handleOpenExperienceDialog = (experience?: Experience) => {
    setEditingExperience(experience || null);
    setIsExperienceDialogOpen(true);
  };

  const handleCloseExperienceDialog = () => {
    setIsExperienceDialogOpen(false);
    setEditingExperience(null);
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المهارة؟")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteSkill(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error || "حدث خطأ أثناء حذف المهارة");
      }
    });
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الخبرة؟")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteExperience(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error || "حدث خطأ أثناء حذف الخبرة");
      }
    });
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <>
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Code className="h-5 w-5 text-blue-600" />
            المهارات والخبرات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Skills Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">المهارات</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenSkillDialog()}
                className="h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5 ml-1" />
                إضافة
              </Button>
            </div>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/70 text-sm group hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{skill.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${skillLevelColors[skill.level] || "bg-slate-100 text-slate-700 border-slate-200"}`}
                    >
                      {skillLevelLabels[skill.level] || skill.level}
                    </Badge>
                    <button
                      onClick={() => handleDeleteSkill(skill.id)}
                      disabled={isPending}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 ml-1"
                      title="حذف"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-2">لا توجد مهارات مضافة</p>
            )}
          </div>

          {/* Experiences Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                الخبرات
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenExperienceDialog()}
                className="h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5 ml-1" />
                إضافة
              </Button>
            </div>
            {experiences.length > 0 ? (
              <div className="space-y-3">
                {experiences.map((experience) => (
                  <div
                    key={experience.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 group hover:bg-slate-100/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                          {experience.title}
                        </h4>
                        <p className="text-xs text-slate-600 mb-2">{experience.organization}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {formatDate(experience.startDate)} -{" "}
                            {experience.endDate
                              ? formatDate(experience.endDate)
                              : "حتى الآن"}
                          </span>
                        </div>
                        {experience.description && (
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                            {experience.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteExperience(experience.id)}
                        disabled={isPending}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 ml-2"
                        title="حذف"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-2">لا توجد خبرات مضافة</p>
            )}
          </div>
        </CardContent>
      </Card>

      <SkillDialog
        key={editingSkill?.id || "new"}
        isOpen={isSkillDialogOpen}
        onCloseAction={handleCloseSkillDialog}
        editingSkill={editingSkill}
        isPending={isPending}
      />

      <ExperienceDialog
        key={editingExperience?.id || "new"}
        isOpen={isExperienceDialogOpen}
        onCloseAction={handleCloseExperienceDialog}
        editingExperience={editingExperience}
        isPending={isPending}
      />
    </>
  );
}
