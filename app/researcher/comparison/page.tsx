import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import { getComparisonData, type ComparisonFilters } from "@/lib/comparisonRepo";
import { ComparisonHeader } from "./_components/ComparisonHeader";
import { ActivityTrendsCard } from "./_components/ActivityTrendsCard";
import { RankOverviewCards } from "./_components/RankOverviewCards";
import { LeaderboardTop } from "./_components/LeaderboardTop";
import { BadgesPanel } from "./_components/BadgesPanel";
import { SimilarFaculty } from "./_components/SimilarFaculty";
import { MetricTabs } from "./_components/MetricTabs";
import { LeaderboardCardRow } from "./_components/LeaderboardCardRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

type ComparisonSearchParams = { year?: string; period?: string; metric?: string };

export default async function ResearcherComparisonPage({
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

  const filters: ComparisonFilters = {
    year: yearParam && yearParam !== "all" ? Number(yearParam) : yearParam ? undefined : currentYear,
    period: periodParam === "first" || periodParam === "second" ? periodParam : "all",
    metric: metricParam ?? "all",
  };

  const data = await getComparisonData(user.id, filters);
  const linkQuery = {
    year: yearParam ?? String(currentYear),
    period: filters.period ?? "all",
    metric: filters.metric ?? "all",
  };

  return (
    <div className="space-y-6">
      <ComparisonHeader
        name={data.currentUser.fullName}
        academicTitle={data.currentUser.academicTitle}
        department={data.currentUser.departmentName}
        college={data.currentUser.collegeName}
        rank={data.ranks.universityRank}
        total={data.overview.totalResearchers}
        totalPoints={data.currentUser.totalPoints}
        filters={{
          year: yearParam ?? String(currentYear),
          period: filters.period ?? "all",
          metric: filters.metric ?? "all",
        }}
      />

      <Card className="border-blue-200 bg-[#2563EB] text-white shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">موقعك الحالي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">
                {data.currentUser.academicTitle} {data.currentUser.fullName}
              </p>
              <p className="text-blue-100">
                {data.currentUser.collegeName} — {data.currentUser.departmentName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-100">النقاط</p>
              <p className="text-2xl font-semibold">{data.currentUser.totalPoints}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-blue-50">
            <span>ترتيب الجامعة: {data.ranks.universityRank}</span>
            <span>•</span>
            <span>ترتيب الكلية: {data.ranks.collegeRank}</span>
            <span>•</span>
            <span>ترتيب القسم: {data.ranks.departmentRank}</span>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <ActivityTrendsCard trends={data.activityTrends} />
      </div>

      <RankOverviewCards
        universityRank={data.ranks.universityRank}
        collegeRank={data.ranks.collegeRank}
        departmentRank={data.ranks.departmentRank}
        totalResearchers={data.overview.totalResearchers}
        totalPoints={data.overview.totalPoints}
        averagePoints={data.overview.averagePoints}
        researchCount={data.overview.researchCount}
        activitiesCount={data.overview.activitiesCount}
      />

      <Card className="border-slate-100 bg-white shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">مقارنة مع متوسطات الكلية والقسم</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">متوسط الكلية</p>
            <p className="text-lg font-semibold text-slate-900">{data.overview.collegeAveragePoints}</p>
            <p className="text-xs text-slate-500 mt-1">
              فرقك: {data.currentUser.totalPoints - data.overview.collegeAveragePoints}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">متوسط القسم</p>
            <p className="text-lg font-semibold text-slate-900">{data.overview.departmentAveragePoints}</p>
            <p className="text-xs text-slate-500 mt-1">
              فرقك: {data.currentUser.totalPoints - data.overview.departmentAveragePoints}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-100 bg-white shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">خطوتك التالية لرفع ترتيبك</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700">
          {data.nextStep.estimatedCollegeRankGain > 0 ? (
            <p>
              إذا رفعت معيار {data.nextStep.metricLabel} +{data.nextStep.pointsToAdd} نقطة
              ستتقدم ~{data.nextStep.estimatedCollegeRankGain} مراتب في الكلية.
            </p>
          ) : (
            <p>
              إذا رفعت معيار {data.nextStep.metricLabel} +{data.nextStep.pointsToAdd} نقطة
              ستحافظ على ترتيبك الحالي في الكلية مع فرصة لتجاوز أقرب زميل.
            </p>
          )}
        </CardContent>
      </Card>

      <LeaderboardTop entries={data.top3University} />

      <div className="grid gap-4 lg:grid-cols-3">
        <BadgesPanel badges={data.badges} />
        <SimilarFaculty items={data.similar} />
        <Card className="border-slate-100 bg-white shadow-lg">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-900">أفضل 10 في الجامعة</CardTitle>
            <Button asChild variant="outline" size="sm" className="h-8 rounded-lg">
              <Link href={{ pathname: "/researcher/comparison/top-university", query: linkQuery }}>
                عرض الكل
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.top10University.length === 0 ? (
              <div className="text-sm text-slate-500">لا توجد بيانات كافية لبناء الترتيب.</div>
            ) : (
              data.top10University.map((entry, index) => (
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

      <Card className="border-slate-100 bg-white shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">مقارنات تخصصية</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="title">
            <TabsList className="mb-4">
              <TabsTrigger value="title">نفس اللقب العلمي (Top 5)</TabsTrigger>
              <TabsTrigger value="specialization">
                نفس التخصص ({data.specialization.specializationLabel})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="title" className="space-y-3">
              {data.specialization.sameAcademicTitle.length === 0 ? (
                <div className="text-sm text-slate-500">لا توجد بيانات كافية لنفس اللقب العلمي.</div>
              ) : (
                data.specialization.sameAcademicTitle.map((entry, index) => (
                  <LeaderboardCardRow
                    key={entry.id}
                    entry={entry}
                    rank={index + 1}
                    isCurrentUser={entry.id === data.currentUser.id}
                  />
                ))
              )}
            </TabsContent>
            <TabsContent value="specialization" className="space-y-3">
              {data.specialization.sameSpecialization.length === 0 ? (
                <div className="text-sm text-slate-500">لا توجد بيانات كافية لنفس التخصص.</div>
              ) : (
                data.specialization.sameSpecialization.map((entry, index) => (
                  <LeaderboardCardRow
                    key={entry.id}
                    entry={entry}
                    rank={index + 1}
                    isCurrentUser={entry.id === data.currentUser.id}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border-slate-100 bg-white shadow-lg">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900">الأفضل في الكلية والقسم</CardTitle>
          <Button asChild variant="outline" size="sm" className="h-8 rounded-lg">
            <Link href={{ pathname: "/researcher/comparison/top-college-department", query: linkQuery }}>
              عرض المزيد
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="college">
            <TabsList className="mb-4">
              <TabsTrigger value="college">الكلية (Top 3)</TabsTrigger>
              <TabsTrigger value="department">القسم (Top 3)</TabsTrigger>
            </TabsList>
            <TabsContent value="college" className="space-y-3">
              {data.top5College.length === 0 ? (
                <div className="text-sm text-slate-500">لا توجد بيانات كافية للكلية الحالية.</div>
              ) : (
                data.top5College.slice(0, 3).map((entry, index) => (
                  <LeaderboardCardRow
                    key={entry.id}
                    entry={entry}
                    rank={index + 1}
                    isCurrentUser={entry.id === data.currentUser.id}
                  />
                ))
              )}
            </TabsContent>
            <TabsContent value="department" className="space-y-3">
              {data.top3Department.length === 0 ? (
                <div className="text-sm text-slate-500">لا توجد بيانات كافية للقسم الحالي.</div>
              ) : (
                data.top3Department.slice(0, 3).map((entry, index) => (
                  <LeaderboardCardRow
                    key={entry.id}
                    entry={entry}
                    rank={index + 1}
                    isCurrentUser={entry.id === data.currentUser.id}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <MetricTabs metricTabs={data.metricTabs} defaultTabId={filters.metric && filters.metric !== "all" ? filters.metric : undefined} />
    </div>
  );
}
