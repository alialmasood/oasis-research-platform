import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSessionUser } from "@/lib/middleware";
import { getComparisonData, type ComparisonFilters } from "@/lib/comparisonRepo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ComparisonSearchParams = { year?: string; period?: string; metric?: string };

export default async function ComparisonTopUniversityPage({
  searchParams,
}: {
  searchParams: Promise<ComparisonSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.roles.includes("RESEARCHER")) {
    redirect("/login");
  }

  const currentYear = new Date().getFullYear();
  const yearParam = typeof resolvedSearchParams?.year === "string" ? resolvedSearchParams.year : undefined;
  const periodParam = typeof resolvedSearchParams?.period === "string" ? resolvedSearchParams.period : undefined;
  const metricParam = typeof resolvedSearchParams?.metric === "string" ? resolvedSearchParams.metric : undefined;

  const linkQuery = {
    year: yearParam,
    period: periodParam,
    metric: metricParam,
  };

  const filters: ComparisonFilters = {
    year: yearParam && yearParam !== "all" ? Number(yearParam) : yearParam ? undefined : currentYear,
    period: periodParam === "first" || periodParam === "second" ? periodParam : "all",
    metric: metricParam ?? "all",
  };

  const data = await getComparisonData(user.id, filters);

  return (
    <div className="space-y-3 md:space-y-6 min-w-0">
      <div className="flex items-center justify-between gap-2 md:gap-3">
        <div className="min-w-0">
          <h1 className="text-base md:text-2xl font-semibold text-gray-900 leading-snug">
            أفضل 10 في الجامعة
          </h1>
          <p className="hidden md:block text-sm text-slate-500 mt-1">
            تعرض البطاقة جميع نشاطات الباحث الأكاديمية كأعداد فعلية.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="h-8 md:h-9 rounded-lg text-[10px] md:text-sm px-2 md:px-3 shrink-0"
        >
          <Link href={{ pathname: "/researcher/comparison", query: linkQuery }}>
            <span className="md:hidden">عودة</span>
            <span className="hidden md:inline">عودة للمقارنات</span>
          </Link>
        </Button>
      </div>

      <div className="grid gap-2 md:gap-4">
        {data.top10University.map((entry, index) => (
          <Card
            key={entry.id}
            className="border-slate-100 bg-white shadow-sm md:shadow-lg gap-0 overflow-hidden rounded-xl md:rounded-2xl"
          >
            <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6 flex flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                {entry.avatarUrl ? (
                  <Image
                    src={entry.avatarUrl}
                    alt={entry.fullName}
                    width={40}
                    height={40}
                    className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] md:text-sm font-semibold border border-slate-200 shrink-0">
                    {entry.fullName.slice(0, 2)}
                  </div>
                )}
                <CardTitle className="text-[12px] md:text-base font-semibold text-slate-900 truncate">
                  #{index + 1} — {entry.fullName}
                </CardTitle>
              </div>
              <span className="text-[10px] md:text-sm font-semibold text-slate-900 shrink-0">
                النقاط: {entry.totalPoints}
              </span>
            </CardHeader>
            <CardContent className="space-y-2 md:space-y-3 px-3 md:px-6 pb-3 md:pb-6">
              <div className="text-[10px] md:text-xs text-slate-500">
                {entry.academicTitle} — {entry.collegeName} — {entry.departmentName}
              </div>
              <div className="grid grid-cols-2 gap-1.5 md:hidden">
                <Badge variant="outline" className="border-slate-200 text-slate-700 text-[9px] justify-center font-normal">
                  البحوث: {entry.researchCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700 text-[9px] justify-center font-normal">
                  المؤتمرات: {entry.conferencesCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700 text-[9px] justify-center font-normal">
                  المناصب: {entry.positionsCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700 text-[9px] justify-center font-normal">
                  الدورات: {entry.coursesCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700 text-[9px] justify-center font-normal">
                  الندوات: {entry.seminarsCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700 text-[9px] justify-center font-normal">
                  اللجان: {entry.committeesCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700 text-[9px] justify-center font-normal">
                  الطوعي: {entry.volunteeringCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700 text-[9px] justify-center font-normal">
                  الزيارات: {entry.fieldVisitsCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700 text-[9px] justify-center font-normal">
                  الإشراف: {entry.supervisionCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700 text-[9px] justify-center font-normal">
                  التقويم: {entry.reviewingCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700 text-[9px] justify-center font-normal">
                  المجلات: {entry.journalsCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700 text-[9px] justify-center font-normal">
                  الورش: {entry.workshopsCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700 text-[9px] justify-center font-normal">
                  التكليفات: {entry.assignmentsCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700 text-[9px] justify-center font-normal">
                  الشهادات: {entry.certificatesCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700 text-[9px] justify-center font-normal">
                  الشكر: {entry.thanksCount}
                </Badge>
              </div>
              <div className="hidden md:flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  البحوث: {entry.researchCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  المؤتمرات: {entry.conferencesCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  المناصب: {entry.positionsCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  الدورات: {entry.coursesCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  الندوات: {entry.seminarsCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  اللجان: {entry.committeesCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  الأعمال الطوعية: {entry.volunteeringCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  الزيارات الميدانية: {entry.fieldVisitsCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  الإشراف: {entry.supervisionCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  التقويم العلمي: {entry.reviewingCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  عضويات المجلات: {entry.journalsCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  ورش العمل: {entry.workshopsCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  التكليفات: {entry.assignmentsCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  شهادات المشاركة: {entry.certificatesCount}
                </Badge>
                <Badge variant="outline" className="border-slate-200 text-slate-700">
                  كتب الشكر: {entry.thanksCount}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
