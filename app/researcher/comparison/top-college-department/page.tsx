import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/middleware";
import { getComparisonData, type ComparisonFilters } from "@/lib/comparisonRepo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeaderboardCardRow } from "@/app/researcher/comparison/_components/LeaderboardCardRow";

type ComparisonSearchParams = { year?: string; period?: string; metric?: string };

export default async function ComparisonTopCollegeDepartmentPage({
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
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900">أفضل التدريسيين في الكلية والقسم</h1>
          <p className="text-sm text-slate-500 mt-1">
            عرض موسع حسب الفلاتر الحالية.
          </p>
        </div>
        <Button asChild variant="outline" className="h-9 rounded-lg">
          <Link href={{ pathname: "/researcher/comparison", query: linkQuery }}>
            عودة للمقارنات
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">أفضل في الكلية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.top5College.length === 0 ? (
              <div className="text-sm text-slate-500">لا توجد بيانات كافية للكلية الحالية.</div>
            ) : (
              data.top5College.map((entry, index) => (
                <LeaderboardCardRow
                  key={entry.id}
                  entry={entry}
                  rank={index + 1}
                  isCurrentUser={entry.id === data.currentUser.id}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">أفضل في القسم</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.top3Department.length === 0 ? (
              <div className="text-sm text-slate-500">لا توجد بيانات كافية للقسم الحالي.</div>
            ) : (
              data.top3Department.map((entry, index) => (
                <LeaderboardCardRow
                  key={entry.id}
                  entry={entry}
                  rank={index + 1}
                  isCurrentUser={entry.id === data.currentUser.id}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
