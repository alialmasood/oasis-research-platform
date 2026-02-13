"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Heart, Calendar, CheckCircle, Clock, Users } from "lucide-react";
import type { Volunteering } from "@prisma/client";

export type VolunteeringStats = {
  total: number;
  ongoing: number;
  completed: number;
  last12Months: number;
  byType: Array<{ name: string; value: number }>;
  byRole: Array<{ name: string; value: number }>;
  byYear: Array<{ name: string; value: number }>;
};

function calculateStats(volunteerings: Volunteering[]): VolunteeringStats {
  const total = volunteerings.length;
  
  const ongoing = volunteerings.filter((v) => v.isOngoing).length;
  const completed = total - ongoing;

  // الأعمال الطوعية خلال آخر 12 شهر
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const last12Months = volunteerings.filter((v) => {
    const startDate = new Date(v.startDate);
    return startDate >= twelveMonthsAgo;
  }).length;

  // حسب نوع العمل
  const typeCounts: Record<string, number> = {};
  volunteerings.forEach((v) => {
    typeCounts[v.type] = (typeCounts[v.type] || 0) + 1;
  });

  const typeLabels: Record<string, string> = {
    HELPING_POOR_NEEDY: "مساعدة الفقراء والمحتاجين",
    ENVIRONMENTAL_PROTECTION: "حماية البيئة",
    EMERGENCY_SUPPORT: "تقديم الدعم في حالة الطوارئ",
    CULTURAL_EDUCATIONAL_ACTIVITIES: "المساهمة في الانشطة الثقافية والتعليمية",
    HELPING_ELDERLY: "مساعدة كبار السن",
    SPORTS_ACTIVITIES: "المشاركة في الانشطة الرياضية",
    SOCIAL_ACTIVITIES: "المشاركة في الانشطة الاجتماعية",
    HOSPITALS_ORPHANAGES: "التطوع في المشتشفيات ودور الايتام",
    EDUCATION_FIELD: "التطوع في مجال التعليم",
    COMMUNITY_DEVELOPMENT: "التطوع في مجال التنمية المجتمعية",
    HUMAN_RIGHTS: "التطوع في مجال حقوق الانسان",
    ARTS_CULTURE: "التطوع في مجال الفنون والثقافة",
    TECHNOLOGY_COMMUNICATIONS: "التطوع في مجال التكنولوجيا والاتصالات",
    LAW_FIELD: "التطوع في مجال القانون",
    HEALTH_FIELD: "التطوع في مجال الصحة",
    FIRST_AID: "التطوع في مجال الاسعافات الأولية",
    ANIMAL_WELFARE: "التطوع في مجال رعاية الحيوان",
  };

  const byType = Object.entries(typeCounts)
    .map(([type, count]) => ({ name: typeLabels[type] || type, value: count }))
    .sort((a, b) => b.value - a.value);

  // حسب الدور
  const roleCounts: Record<string, number> = {};
  volunteerings.forEach((v) => {
    roleCounts[v.role] = (roleCounts[v.role] || 0) + 1;
  });

  const roleLabels: Record<string, string> = {
    COORDINATOR: "منسق",
    LEADER: "قائد",
    PARTICIPANT: "مشارك",
    MEMBER: "عضو",
    VOLUNTEER: "متطوع",
  };

  const byRole = Object.entries(roleCounts)
    .map(([role, count]) => ({ name: roleLabels[role] || role, value: count }))
    .sort((a, b) => b.value - a.value);

  // حسب السنة
  const byYear = volunteerings.reduce<Record<number, number>>((acc, v) => {
    const y = new Date(v.startDate).getFullYear();
    acc[y] = (acc[y] ?? 0) + 1;
    return acc;
  }, {});

  const byYearData = Object.entries(byYear)
    .map(([year, count]) => ({ name: year, value: count }))
    .sort((a, b) => Number(a.name) - Number(b.name));

  return {
    total,
    ongoing,
    completed,
    last12Months,
    byType,
    byRole,
    byYear: byYearData,
  };
}

export function useVolunteeringStats(volunteerings: Volunteering[]): VolunteeringStats {
  return calculateStats(volunteerings);
}

export function VolunteeringKPICards({ stats }: { stats: VolunteeringStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* إجمالي الأعمال الطوعية */}
      <Card className="border border-slate-100 border-r-4 border-r-blue-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-blue-500/10 p-2 rounded-lg flex-shrink-0">
              <Heart className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.total}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">إجمالي الأعمال الطوعية</p>
        </CardContent>
      </Card>

      {/* مستمر */}
      <Card className="border border-slate-100 border-r-4 border-r-green-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-green-500/10 p-2 rounded-lg flex-shrink-0">
              <Clock className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.ongoing}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">مستمر</p>
        </CardContent>
      </Card>

      {/* آخر 12 شهر */}
      <Card className="border border-slate-100 border-r-4 border-r-purple-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-purple-500/10 p-2 rounded-lg flex-shrink-0">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.last12Months}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">آخر 12 شهر</p>
        </CardContent>
      </Card>

      {/* مكتمل */}
      <Card className="border border-slate-100 border-r-4 border-r-amber-500 bg-white shadow-lg min-h-[92px]">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="bg-amber-500/10 p-2 rounded-lg flex-shrink-0">
              <CheckCircle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900">
              {stats.completed}
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-tight">مكتمل</p>
        </CardContent>
      </Card>
    </div>
  );
}
