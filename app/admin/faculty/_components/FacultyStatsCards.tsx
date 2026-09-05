"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  GraduationCap,
  Award,
  Building2,
  CheckCircle2,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FacultyStats } from "@/lib/admin/facultyTypes";

type StatCard = {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  border: string;
  iconBg: string;
  iconColor: string;
};

interface FacultyStatsCardsProps {
  stats: FacultyStats;
}

export function FacultyStatsCards({ stats }: FacultyStatsCardsProps) {
  const cards: StatCard[] = [
    {
      label: "إجمالي التدريسيين",
      value: stats.totalFaculty,
      hint: "المسجلون في النظام",
      icon: Users,
      border: "border-r-blue-600",
      iconBg: "bg-blue-600/10",
      iconColor: "text-blue-600",
    },
    {
      label: "الشهادات العلمية",
      value: stats.totalDegrees,
      hint: `${stats.withAcademicDegrees} تدريسي لديهم شهادات`,
      icon: GraduationCap,
      border: "border-r-indigo-600",
      iconBg: "bg-indigo-600/10",
      iconColor: "text-indigo-600",
    },
    {
      label: "حاملي الدكتوراه",
      value: stats.phdHolders,
      icon: Award,
      border: "border-r-emerald-600",
      iconBg: "bg-emerald-600/10",
      iconColor: "text-emerald-600",
    },
    {
      label: "التشكيلات",
      value: stats.entitiesCount,
      hint: `${stats.departmentsCount} قسم`,
      icon: Building2,
      border: "border-r-amber-600",
      iconBg: "bg-amber-600/10",
      iconColor: "text-amber-600",
    },
    {
      label: "ملفات مكتملة",
      value: stats.completeProfiles,
      hint: "100% من بيانات الملف",
      icon: CheckCircle2,
      border: "border-r-teal-600",
      iconBg: "bg-teal-600/10",
      iconColor: "text-teal-600",
    },
    {
      label: "بانتظار الإكمال",
      value: stats.incompleteProfiles,
      hint: "تحتاج استكمال البيانات",
      icon: AlertCircle,
      border: "border-r-orange-600",
      iconBg: "bg-orange-600/10",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className={cn(
              "border border-slate-100 bg-white shadow-lg border-r-4 min-h-[108px]",
              card.border
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                  {card.hint && (
                    <p className="text-[11px] text-slate-400 mt-1 truncate">{card.hint}</p>
                  )}
                </div>
                <div className={cn("p-2.5 rounded-lg flex-shrink-0", card.iconBg)}>
                  <Icon className={cn("h-5 w-5", card.iconColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
