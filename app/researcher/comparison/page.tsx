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
import { RaisePointsHelpButton } from "./_components/RaisePointsHelpButton";
import { CollegeDepartmentLeaders } from "./_components/CollegeDepartmentLeaders";
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

  const sortedTrendYears = [...data.activityTrends.yearly].sort((a, b) => a.year - b.year);
  const lastTrendYear = sortedTrendYears.at(-1);
  const prevTrendYear = sortedTrendYears.at(-2);
  let positionTrendLabel = "لا تتوفر بيانات كافية لتحديد الاتجاه.";
  let positionMotivationLabel = "سجّل نشاطاتك باستمرار لرؤية تحسن واضح.";
  if (lastTrendYear && prevTrendYear) {
    if (lastTrendYear.points > prevTrendYear.points) {
      positionTrendLabel = "الاتجاه العام تصاعدي مقارنة بالعام السابق.";
      positionMotivationLabel = "استمر على هذا الإيقاع، وستحقق قفزة إضافية هذا العام.";
    } else if (lastTrendYear.points < prevTrendYear.points) {
      positionTrendLabel = "الاتجاه العام متراجع مقارنة بالعام السابق.";
      positionMotivationLabel = "رفع نشاط بسيط في الأشهر القادمة يعكس الاتجاه للأعلى.";
    } else {
      positionTrendLabel = "الاتجاه العام ثابت تقريبًا مقارنة بالعام السابق.";
      positionMotivationLabel = "تحسين محدود في معيار واحد يكسر حالة الثبات سريعًا.";
    }
  }
  const bestActivityYearLabel = data.activityTrends.bestYear
    ? String(data.activityTrends.bestYear)
    : "—";

  const currentTrendYear = data.activityTrends.yearly.find((entry) => entry.isCurrent);
  const bestTrendYearPoints =
    data.activityTrends.yearly.find((entry) => entry.isBest)?.points ?? null;
  const currentTrendYearPoints = currentTrendYear?.points ?? null;
  const deltaFromBestYear =
    currentTrendYearPoints != null && bestTrendYearPoints != null
      ? bestTrendYearPoints - currentTrendYearPoints
      : null;
  const smartInsightLabel =
    deltaFromBestYear != null
      ? deltaFromBestYear > 0
        ? `نشاطك هذا العام أقل بـ ${deltaFromBestYear} نقطة من أعلى سنة لك.`
        : "نشاطك في تحسّن مقارنة بأفضل سنة لك."
      : "سجّل المزيد من النشاطات لبناء تحليل أدق.";

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

      <Card className="border border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="pb-3 pt-4 px-4 md:px-5 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base font-semibold text-slate-900">
              موقعك الحالي
            </CardTitle>
            <div className="flex items-center gap-2 shrink-0">
              <RaisePointsHelpButton />
              <div className="h-10 min-w-[148px] inline-flex items-center justify-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3">
                <span className="text-xs font-medium text-slate-500">إجمالي النقاط</span>
                <span className="text-lg font-black tabular-nums text-slate-900 leading-none">
                  {data.currentUser.totalPoints}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 md:items-stretch">
            {/* الهوية والترتيب */}
            <div className="p-4 md:p-5 flex flex-col justify-center gap-3 border-b md:border-b-0 md:border-l border-slate-200">
              <div>
                <p className="font-semibold text-slate-900 text-base leading-snug">
                  {data.currentUser.academicTitle} {data.currentUser.fullName}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {data.currentUser.collegeName} — {data.currentUser.departmentName}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-2 py-2 text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5">الجامعة</p>
                  <p className="text-lg font-bold text-slate-900 tabular-nums">
                    {data.ranks.universityRank}
                  </p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-2 py-2 text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5">الكلية</p>
                  <p className="text-lg font-bold text-slate-900 tabular-nums">
                    {data.ranks.collegeRank}
                  </p>
                </div>
                <div className="rounded-lg border border-violet-200 bg-violet-50/50 px-2 py-2 text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5">القسم</p>
                  <p className="text-lg font-bold text-slate-900 tabular-nums">
                    {data.ranks.departmentRank}
                  </p>
                </div>
              </div>
            </div>

            {/* التحليل والتوصية */}
            <div className="p-3 md:p-4 grid grid-rows-3 gap-2 bg-slate-50/40">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-500 mb-0.5">أفضل سنة نشاطًا</p>
                  <p className="text-base font-bold text-slate-900 tabular-nums">{bestActivityYearLabel}</p>
                </div>
                <div className="min-w-0 flex-1 text-end border-r border-slate-100 pr-3">
                  <p className="text-[11px] font-medium text-slate-500 mb-0.5">تحديد الاتجاه</p>
                  <p className="text-xs text-slate-800 leading-snug line-clamp-2">{positionTrendLabel}</p>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 flex flex-col justify-center">
                <p className="text-[11px] font-medium text-slate-500 mb-0.5">التوصية</p>
                <p className="text-xs text-slate-700 leading-snug line-clamp-2">{positionMotivationLabel}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 flex flex-col justify-center">
                <p className="text-[11px] font-medium text-slate-500 mb-0.5">تحليل ذكي</p>
                <p className="text-xs text-slate-700 leading-snug line-clamp-2">{smartInsightLabel}</p>
              </div>
            </div>
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

      <Card className="border-slate-100 bg-white shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 md:items-stretch">
            <div className="p-4 md:p-5 border-b md:border-b-0 md:border-l border-slate-200 space-y-3">
              <h3 className="text-base font-semibold text-slate-900">
                مقارنة مع متوسطات الكلية والقسم
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 px-4 py-3">
                  <p className="text-xs text-slate-500">متوسط الكلية</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {data.overview.collegeAveragePoints}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    فرقك: {data.currentUser.totalPoints - data.overview.collegeAveragePoints}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 px-4 py-3">
                  <p className="text-xs text-slate-500">متوسط القسم</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {data.overview.departmentAveragePoints}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    فرقك: {data.currentUser.totalPoints - data.overview.departmentAveragePoints}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-5 flex flex-col justify-center gap-2 bg-slate-50/40">
              <h3 className="text-base font-semibold text-slate-900">
                خطوتك التالية لرفع ترتيبك
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {data.nextStep.estimatedCollegeRankGain > 0 ? (
                  <>
                    إذا رفعت معيار {data.nextStep.metricLabel} +{data.nextStep.pointsToAdd} نقطة
                    ستتقدم ~{data.nextStep.estimatedCollegeRankGain} مراتب في الكلية.
                  </>
                ) : (
                  <>
                    إذا رفعت معيار {data.nextStep.metricLabel} +{data.nextStep.pointsToAdd} نقطة
                    ستحافظ على ترتيبك الحالي في الكلية مع فرصة لتجاوز أقرب زميل.
                  </>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <LeaderboardTop entries={data.top3University} />

      <Card className="border-slate-100 bg-white shadow-lg">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            أفضل 10 تدريسيين في الجامعة
          </CardTitle>
          <Button asChild variant="outline" size="sm" className="h-8 rounded-lg shrink-0">
            <Link href={{ pathname: "/researcher/comparison/top-university", query: linkQuery }}>
              عرض الكل
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.top10University.length === 0 ? (
            <div className="text-sm text-slate-500">لا توجد بيانات كافية لبناء الترتيب.</div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
              {data.top10University.map((entry, index) => (
                <LeaderboardCardRow
                  key={entry.id}
                  entry={entry}
                  rank={index + 1}
                  isCurrentUser={entry.id === data.currentUser.id}
                  variant="compact"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
        <BadgesPanel badges={data.badges} />
        <SimilarFaculty items={data.similar} />
      </div>

      <Card className="border-slate-100 bg-white shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">مقارنات تخصصية</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="title" className="gap-4">
            <TabsList className="h-auto w-full flex flex-wrap justify-start gap-1 rounded-xl bg-slate-100 p-1 sm:w-fit">
              <TabsTrigger
                value="title"
                className="rounded-lg px-3 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                نفس اللقب العلمي
              </TabsTrigger>
              <TabsTrigger
                value="specialization"
                className="rounded-lg px-3 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                نفس التخصص
                {data.specialization.specializationLabel
                  ? ` (${data.specialization.specializationLabel})`
                  : ""}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="title">
              {data.specialization.sameAcademicTitle.length === 0 ? (
                <div className="min-h-[120px] flex items-center justify-center text-sm text-slate-500 text-center px-4">
                  لا توجد بيانات كافية لنفس اللقب العلمي.
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                  {data.specialization.sameAcademicTitle.map((entry, index) => (
                    <LeaderboardCardRow
                      key={entry.id}
                      entry={entry}
                      rank={index + 1}
                      isCurrentUser={entry.id === data.currentUser.id}
                      variant="compact"
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="specialization">
              {data.specialization.sameSpecialization.length === 0 ? (
                <div className="min-h-[120px] flex items-center justify-center text-sm text-slate-500 text-center px-4">
                  لا توجد بيانات كافية لنفس التخصص.
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                  {data.specialization.sameSpecialization.map((entry, index) => (
                    <LeaderboardCardRow
                      key={entry.id}
                      entry={entry}
                      rank={index + 1}
                      isCurrentUser={entry.id === data.currentUser.id}
                      variant="compact"
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CollegeDepartmentLeaders
        collegeEntries={data.top5College.slice(0, 3)}
        departmentEntries={data.top3Department.slice(0, 3)}
        collegeName={data.currentUser.collegeName}
        departmentName={data.currentUser.departmentName}
        collegeRank={data.ranks.collegeRank}
        departmentRank={data.ranks.departmentRank}
        currentUserId={data.currentUser.id}
        moreHref={{ pathname: "/researcher/comparison/top-college-department", query: linkQuery }}
      />

      <MetricTabs
        metricTabs={data.metricTabs}
        defaultTabId={filters.metric && filters.metric !== "all" ? filters.metric : undefined}
        currentUserId={data.currentUser.id}
      />
    </div>
  );
}
