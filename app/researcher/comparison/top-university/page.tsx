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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900">أفضل 10 في الجامعة</h1>
          <p className="text-sm text-slate-500 mt-1">
            تعرض البطاقة جميع نشاطات الباحث الأكاديمية كأعداد فعلية.
          </p>
        </div>
        <Button asChild variant="outline" className="h-9 rounded-lg">
          <Link href={{ pathname: "/researcher/comparison", query: linkQuery }}>
            عودة للمقارنات
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {data.top10University.map((entry, index) => (
          <Card key={entry.id} className="border-slate-100 bg-white shadow-lg">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                {entry.avatarUrl ? (
                  <Image
                    src={entry.avatarUrl}
                    alt={entry.fullName}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-semibold border border-slate-200">
                    {entry.fullName.slice(0, 2)}
                  </div>
                )}
                <CardTitle className="text-base font-semibold text-slate-900">
                  #{index + 1} — {entry.fullName}
                </CardTitle>
              </div>
              <span className="text-sm font-semibold text-slate-900">النقاط: {entry.totalPoints}</span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-slate-500">
                {entry.academicTitle} — {entry.collegeName} — {entry.departmentName}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
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
