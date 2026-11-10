import { Card, CardContent } from "@/components/ui/card";
import { Building2, GraduationCap, Landmark, Sparkles } from "lucide-react";

type RankOverviewCardsProps = {
  universityRank: number;
  collegeRank: number;
  departmentRank: number;
  totalResearchers: number;
  totalPoints: number;
  averagePoints: number;
  researchCount: number;
  activitiesCount: number;
};

export function RankOverviewCards({
  universityRank,
  collegeRank,
  departmentRank,
  totalResearchers,
  totalPoints,
  averagePoints,
  researchCount,
  activitiesCount,
}: RankOverviewCardsProps) {
  const diff = totalPoints - averagePoints;
  const diffPercent = averagePoints > 0 ? Math.round((diff / averagePoints) * 100) : 0;
  const diffLabel = averagePoints > 0 ? `${diff > 0 ? "أعلى" : diff < 0 ? "أقل" : "مساوٍ"} من متوسط الجامعة` : "لا يوجد متوسط متاح";
  const diffTone = diff >= 0 ? "text-emerald-600" : "text-rose-600";

  const mobileItems = [
    {
      key: "uni",
      label: "ترتيب الجامعة",
      value: String(universityRank),
      icon: Landmark,
      softBg: "bg-amber-50",
      softText: "text-amber-600",
    },
    {
      key: "college",
      label: "ترتيب الكلية",
      value: String(collegeRank),
      icon: Building2,
      softBg: "bg-blue-50",
      softText: "text-blue-600",
    },
    {
      key: "dept",
      label: "ترتيب القسم",
      value: String(departmentRank),
      icon: GraduationCap,
      softBg: "bg-violet-50",
      softText: "text-violet-600",
    },
    {
      key: "points",
      label: "إجمالي النقاط",
      value: String(totalPoints),
      icon: Sparkles,
      softBg: "bg-emerald-50",
      softText: "text-emerald-600",
    },
  ];

  return (
    <>
      {/* KPI موبايل 2×2 */}
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {mobileItems.map(({ key, label, value, icon: Icon, softBg, softText }) => (
          <div
            key={key}
            className="h-[64px] rounded-xl border border-slate-100 bg-white px-2.5 py-2 min-w-0 shadow-sm flex items-center"
          >
            <div className="flex items-center gap-2 min-w-0 w-full">
              <div className={`h-8 w-8 rounded-lg ${softBg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-3.5 w-3.5 ${softText}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold tabular-nums text-gray-900 leading-none truncate">
                  {value}
                </div>
                <p className="mt-1 text-[10px] text-slate-500 leading-tight truncate">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* سطح المكتب — بدون تغيير */}
      <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-amber-200 bg-white shadow-sm border-r-4 border-r-amber-500">
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">ترتيب الجامعة</p>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{universityRank}</p>
            <p className="text-xs text-slate-500 mt-1">من أصل {totalResearchers} باحث</p>
          </CardContent>
        </Card>
        <Card className="border border-blue-200 bg-white shadow-sm border-r-4 border-r-blue-600">
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">ترتيب الكلية</p>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{collegeRank}</p>
            <p className="text-xs text-slate-500 mt-1">ضمن الكلية الحالية</p>
          </CardContent>
        </Card>
        <Card className="border border-violet-200 bg-white shadow-sm border-r-4 border-r-violet-500">
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">ترتيب القسم</p>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{departmentRank}</p>
            <p className="text-xs text-slate-500 mt-1">ضمن القسم الحالي</p>
          </CardContent>
        </Card>
        <Card className="border border-emerald-200 bg-white shadow-sm border-r-4 border-r-emerald-500">
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">إجمالي النقاط</p>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{totalPoints}</p>
            <p className={`text-xs mt-1 ${averagePoints > 0 ? diffTone : "text-slate-500"}`}>
              {averagePoints > 0 ? `${diff > 0 ? "↑" : diff < 0 ? "↓" : "•"} ${Math.abs(diffPercent)}%` : "—"}
              {" "}
              {diffLabel}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {researchCount} أبحاث — {activitiesCount} نشاط
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
