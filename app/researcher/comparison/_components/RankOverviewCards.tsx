import { Card, CardContent } from "@/components/ui/card";

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

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-slate-100 bg-white shadow-lg">
        <CardContent className="pt-5">
          <p className="text-sm text-slate-500">ترتيب الجامعة</p>
          <p className="text-2xl font-semibold text-slate-900 mt-2">{universityRank}</p>
          <p className="text-xs text-slate-500 mt-1">من أصل {totalResearchers} باحث</p>
        </CardContent>
      </Card>
      <Card className="border-slate-100 bg-white shadow-lg">
        <CardContent className="pt-5">
          <p className="text-sm text-slate-500">ترتيب الكلية</p>
          <p className="text-2xl font-semibold text-slate-900 mt-2">{collegeRank}</p>
          <p className="text-xs text-slate-500 mt-1">ضمن الكلية الحالية</p>
        </CardContent>
      </Card>
      <Card className="border-slate-100 bg-white shadow-lg">
        <CardContent className="pt-5">
          <p className="text-sm text-slate-500">ترتيب القسم</p>
          <p className="text-2xl font-semibold text-slate-900 mt-2">{departmentRank}</p>
          <p className="text-xs text-slate-500 mt-1">ضمن القسم الحالي</p>
        </CardContent>
      </Card>
      <Card className="border-slate-100 bg-white shadow-lg">
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
  );
}
