import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/middleware";
import {
  getAdminDashboardStats,
  type AdminDashboardActivityStat,
  type AdminDashboardOrgBucket,
} from "@/lib/admin/dashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileSearch,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  Network,
  Presentation,
  School,
  Target,
  Users,
  UserX,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatCount(value: number) {
  return value.toLocaleString("ar-IQ");
}

function CompactStat({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  href,
  emphasize,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone: string;
  href?: string;
  emphasize?: boolean;
}) {
  const body = (
    <div
      className={cn(
        "rounded-lg border border-slate-100 bg-white px-3 py-2.5 shadow-sm transition-colors",
        href && "hover:border-slate-200 hover:bg-slate-50/80",
        emphasize && "border-blue-100 bg-gradient-to-l from-white to-blue-50/40"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium leading-tight text-slate-500">{label}</p>
        <div className={cn("rounded-md p-1.5", tone)}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </div>
      </div>
      <p
        className={cn(
          "mt-1 font-bold tabular-nums text-slate-900",
          emphasize ? "text-xl" : "text-lg"
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[10px] leading-snug text-slate-400">{hint}</p> : null}
    </div>
  );

  if (!href) return body;
  return (
    <Link
      href={href}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
    >
      {body}
    </Link>
  );
}

function SectionShell({
  title,
  description,
  icon: Icon,
  iconClassName,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconClassName?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                iconClassName ?? "bg-slate-100 text-slate-600"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          </div>
          {description ? (
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500 sm:pr-10">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

function GapCard({
  label,
  description,
  count,
  total,
}: {
  label: string;
  description: string;
  count: number;
  total: number;
}) {
  const ratio = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{description}</p>
        </div>
        <div className="shrink-0 text-left" dir="ltr">
          <p className="text-lg font-bold tabular-nums text-amber-700">{formatCount(count)}</p>
          <p className="text-[11px] text-slate-500">{ratio}%</p>
        </div>
      </div>
    </div>
  );
}

function coveragePct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function OrgDistributionList({
  title,
  emptyLabel,
  buckets,
}: {
  title: string;
  emptyLabel: string;
  buckets: AdminDashboardOrgBucket[];
}) {
  const max = buckets[0]?.total ?? 0;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {buckets.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2.5">
          {buckets.map((bucket) => {
            const width = max > 0 ? Math.max(8, Math.round((bucket.total / max) * 100)) : 0;
            return (
              <li key={bucket.name}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-slate-700">{bucket.name}</span>
                  <span className="shrink-0 tabular-nums text-slate-900">
                    {formatCount(bucket.total)}
                    <span className="text-slate-400"> · {formatCount(bucket.active)} نشط</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500/80"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CoverageMeter({
  label,
  withCount,
  withoutCount,
  total,
  href,
}: {
  label: string;
  withCount: number;
  withoutCount: number;
  total: number;
  href: string;
}) {
  const pct = coveragePct(withCount, total);
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-0.5 text-[12px] text-slate-500">
            {formatCount(withCount)} مكتمل · {formatCount(withoutCount)} ناقص من أصل{" "}
            {formatCount(total)}
          </p>
        </div>
        <p className="shrink-0 text-lg font-bold tabular-nums text-slate-900">{pct}%</p>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-200/80">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <Link
        href={href}
        className="mt-2.5 inline-block text-[12px] font-medium text-blue-600 hover:text-blue-700"
      >
        فتح التفاصيل
      </Link>
    </div>
  );
}

const ACTIVITY_META: Record<
  AdminDashboardActivityStat["key"],
  { icon: LucideIcon; tone: string }
> = {
  conferences: { icon: Presentation, tone: "bg-rose-500/10 text-rose-600" },
  seminars: { icon: School, tone: "bg-sky-500/10 text-sky-600" },
  courses: { icon: GraduationCap, tone: "bg-indigo-500/10 text-indigo-600" },
  workshops: { icon: Wrench, tone: "bg-amber-500/10 text-amber-600" },
  assignments: { icon: ClipboardList, tone: "bg-teal-500/10 text-teal-600" },
  committees: { icon: UsersRound, tone: "bg-violet-500/10 text-violet-600" },
};

export default async function AdminDashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.roles.includes("ADMIN")) {
    redirect("/login");
  }

  const stats = await getAdminDashboardStats();
  const {
    faculty,
    structure,
    research,
    periodCounts,
    gaps,
    academicYearLabel,
    orgByEntity,
    orgByDepartment,
    evaluation,
    activities,
    coverage,
  } = stats;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-sm font-medium text-[#2563EB]">
          جامعة البصرة · العام الدراسي {academicYearLabel}
        </p>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">لوحة تحكم الإدارة</h1>
        <p className="mt-1 text-sm text-slate-500">
          متابعة الكادر والبحوث والنشاطات الأكاديمية من بيانات المنصة الفعلية.
        </p>
      </div>

      {/* الكادر */}
      <div className="grid gap-2 sm:grid-cols-3">
        <CompactStat
          label="التدريسيون"
          value={formatCount(faculty.totalFaculty)}
          hint={`${formatCount(faculty.activeFaculty)} نشط · ${formatCount(faculty.inactiveFaculty)} معطّل`}
          icon={Users}
          tone="bg-blue-500/10 text-blue-600"
          href="/admin/faculty"
        />
        <CompactStat
          label="ملفات غير مكتملة"
          value={formatCount(faculty.incompleteProfiles)}
          hint={`${formatCount(faculty.completeProfiles)} ملف مكتمل`}
          icon={UserX}
          tone="bg-amber-500/10 text-amber-600"
          href="/admin/faculty?completion=incomplete"
        />
        <CompactStat
          label="نشاطات العام الدراسي"
          value={formatCount(activities.academicYearAll)}
          hint={`${formatCount(activities.totalAll)} إجمالي مسجّل`}
          icon={CalendarDays}
          tone="bg-emerald-500/10 text-emerald-600"
        />
      </div>

      {/* الهيكل التنظيمي — بدل بطاقة التشكيلات العامة */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <CompactStat
          label="الكليات"
          value={formatCount(structure.colleges)}
          hint="كل تشكيلة تبدأ باسم كلية"
          icon={School}
          tone="bg-blue-500/10 text-blue-600"
          href="/admin/entities"
        />
        <CompactStat
          label="المراكز"
          value={formatCount(structure.centers)}
          hint="كل تشكيلة تبدأ باسم مركز"
          icon={Building2}
          tone="bg-indigo-500/10 text-indigo-600"
          href="/admin/entities"
        />
        <CompactStat
          label="الأقسام"
          value={formatCount(structure.departments)}
          hint="تابعة للكليات والمراكز"
          icon={Network}
          tone="bg-slate-500/10 text-slate-600"
          href="/admin/entities"
        />
        <CompactStat
          label="الفروع"
          value={formatCount(structure.branches)}
          hint="تابعة للكليات والمراكز"
          icon={GitBranch}
          tone="bg-violet-500/10 text-violet-600"
          href="/admin/entities"
        />
      </div>

      {/* قسم البحوث — بارز ومنفصل */}
      <SectionShell
        title="البحوث"
        description="إحصائيات مستمدة من نشاط البحوث لدى الباحثين — نفس مصدر صفحة الأنشطة البحثية."
        icon={BookOpen}
        iconClassName="bg-blue-600 text-white"
        className="ring-1 ring-blue-100/80"
        action={
          <Button asChild size="sm" className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700">
            <Link href="/admin/research">عرض البحوث</Link>
          </Button>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <CompactStat
            label="إجمالي البحوث"
            value={formatCount(research.total)}
            hint={`${formatCount(research.researchersWithResearch)} باحث لديهم بحوث`}
            icon={BookOpen}
            tone="bg-emerald-500/10 text-emerald-600"
            href="/admin/research"
            emphasize
          />
          <CompactStat
            label="غير منجزة"
            value={formatCount(research.inProgress)}
            hint={
              research.avgProgressInProgress > 0
                ? `متوسط التقدّم ${Math.round(research.avgProgressInProgress)}%`
                : "لا يوجد متوسط تقدّم بعد"
            }
            icon={ClipboardList}
            tone="bg-sky-500/10 text-sky-600"
            href="/admin/research?status=IN_PROGRESS"
          />
          <CompactStat
            label="منجزة"
            value={formatCount(research.completed)}
            hint={`${formatCount(research.published)} منشور`}
            icon={CheckCircle2}
            tone="bg-violet-500/10 text-violet-600"
            href="/admin/research?status=COMPLETED"
          />
          <CompactStat
            label="سكوبس"
            value={formatCount(research.scopus)}
            hint={`${formatCount(research.international)} عالمي · ${formatCount(research.isi)} ISI`}
            icon={FileSearch}
            tone="bg-indigo-500/10 text-indigo-600"
            href="/admin/research/scopus"
          />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "هذا الشهر", value: periodCounts.month },
            { label: "هذه السنة", value: periodCounts.year },
            { label: "العام الدراسي", value: periodCounts.academic },
            { label: "الفصل الحالي", value: periodCounts.semester },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2"
            >
              <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
              <p className="mt-0.5 text-base font-semibold tabular-nums text-slate-900">
                {formatCount(item.value)}
              </p>
              <p className="text-[10px] text-slate-400">بحوث مسجّلة / محدّثة</p>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* قسم النشاطات — منفصل عن البحوث */}
      <SectionShell
        title="النشاطات الأكاديمية"
        description="مؤتمرات، ندوات، دورات، ورش عمل، تكليفات، ولجان — مجمّعة من صفحات أنشطة الباحث."
        icon={Presentation}
        iconClassName="bg-slate-800 text-white"
        action={
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium tabular-nums text-slate-600">
            {formatCount(activities.totalAll)} إجمالي
          </span>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {activities.items.map((item) => {
            const meta = ACTIVITY_META[item.key];
            return (
              <CompactStat
                key={item.key}
                label={item.label}
                value={formatCount(item.total)}
                hint={`${formatCount(item.academicYear)} في العام الدراسي`}
                icon={meta.icon}
                tone={meta.tone}
              />
            );
          })}
        </div>
      </SectionShell>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-slate-100 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />
              يحتاج متابعة
            </CardTitle>
            <p className="text-[13px] text-slate-500">
              فجوات مستخرجة من بيانات الباحثين والبحوث — العام الدراسي {academicYearLabel}.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {gaps.length === 0 ? (
              <p className="text-sm text-slate-500">لا توجد مؤشرات فجوات متاحة حاليًا.</p>
            ) : (
              gaps.map((gap) => (
                <GapCard
                  key={gap.id}
                  label={gap.label}
                  description={gap.description}
                  count={gap.count}
                  total={gap.totalResearchers}
                />
              ))
            )}
            <Button asChild variant="outline" className="h-9 rounded-lg border-slate-200">
              <Link href="/admin/research/indicators">فتح مؤشرات الباحثين</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
              <GraduationCap className="h-4 w-4 text-blue-600" aria-hidden />
              لمحة عن الكادر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5">
              <span className="text-slate-600">حملة الدكتوراه</span>
              <span className="font-semibold tabular-nums text-slate-900">
                {formatCount(faculty.phdHolders)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5">
              <span className="text-slate-600">ماجستير فأعلى</span>
              <span className="font-semibold tabular-nums text-slate-900">
                {formatCount(faculty.mastersHolders)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5">
              <span className="text-slate-600">الكليات</span>
              <span className="font-semibold tabular-nums text-slate-900">
                {formatCount(structure.colleges)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5">
              <span className="text-slate-600">المراكز</span>
              <span className="font-semibold tabular-nums text-slate-900">
                {formatCount(structure.centers)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5">
              <span className="text-slate-600">الأقسام</span>
              <span className="font-semibold tabular-nums text-slate-900">
                {formatCount(structure.departments)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5">
              <span className="text-slate-600">الفروع</span>
              <span className="font-semibold tabular-nums text-slate-900">
                {formatCount(structure.branches)}
              </span>
            </div>
            <Button asChild className="h-9 w-full rounded-lg bg-blue-600 hover:bg-blue-700">
              <Link href="/admin/faculty">إدارة التدريسيين</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-100 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-slate-900">
            <Building2 className="h-4 w-4 text-slate-500" aria-hidden />
            التوزيع حسب الكلية/المركز والقسم
          </CardTitle>
          <p className="text-[13px] text-slate-500">
            أعلى التشكيلات والأقسام بعدد التدريسيين المسجّلين في المنصة.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 lg:grid-cols-2">
            <OrgDistributionList
              title="الكليات والمراكز"
              emptyLabel="لا توجد كليات أو مراكز مسجّلة بعد."
              buckets={orgByEntity}
            />
            <OrgDistributionList
              title="الأقسام والفروع"
              emptyLabel="لا توجد أقسام أو فروع مسجّلة بعد."
              buckets={orgByDepartment}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-100 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
              <LineChart className="h-4 w-4 text-violet-600" aria-hidden />
              ملخص التقييم السنوي ({evaluation.evaluationYear})
            </CardTitle>
            <p className="text-[13px] text-slate-500">
              نفس منطق صفحة التقييم — متوسط الدرجات وتوزيع المستويات.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "المتوسط", value: formatCount(evaluation.averageScore) },
                { label: "ممتاز", value: formatCount(evaluation.excellentCount) },
                { label: "جيد", value: formatCount(evaluation.goodCount) },
                { label: "يحتاج تحسين", value: formatCount(evaluation.needsImprovementCount) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-center"
                >
                  <p className="text-[11px] text-slate-500">{item.label}</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900">أعلى 5 باحثين</p>
              {evaluation.topEntries.length === 0 ? (
                <p className="text-sm text-slate-500">لا توجد نتائج تقييم بعد.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                  {evaluation.topEntries.map((entry, index) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          <span className="tabular-nums text-slate-400">{index + 1}. </span>
                          {entry.displayName}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {[entry.entity, entry.department].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold tabular-nums text-violet-700">
                        {entry.score}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button asChild variant="outline" className="h-9 rounded-lg border-slate-200">
              <Link href="/admin/research/evaluation">فتح صفحة التقييم</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-100 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
              <Target className="h-4 w-4 text-emerald-600" aria-hidden />
              تغطية الأهداف واستمارة 21
            </CardTitle>
            <p className="text-[13px] text-slate-500">
              على مستوى الجامعة — الأهداف لسنة {coverage.goalsYear} واستمارة 21 للعام{" "}
              {coverage.form21YearLabel}.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <CoverageMeter
              label="الأهداف السنوية"
              withCount={coverage.withGoals}
              withoutCount={coverage.withoutGoals}
              total={coverage.activeFaculty}
              href="/admin/research/indicators"
            />
            <CoverageMeter
              label="استمارة رقم 21"
              withCount={coverage.withForm21}
              withoutCount={coverage.withoutForm21}
              total={coverage.activeFaculty}
              href="/admin/research/evaluation"
            />
            <p className="text-[12px] leading-relaxed text-slate-500">
              النسبة محسوبة على التدريسيين النشطين فقط. تُطابق صيغ العام الدراسي المختلفة
              المسجّلة في الاستمارات.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-100 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-slate-900">
            <LayoutDashboard className="h-4 w-4 text-slate-500" aria-hidden />
            اختصارات المتابعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: "/admin/faculty",
                title: "التدريسيون",
                desc: "قائمة الكادر والملفات",
                icon: Users,
              },
              {
                href: "/admin/research",
                title: "البحوث",
                desc: "رؤية شاملة للنشاط البحثي",
                icon: BookOpen,
              },
              {
                href: "/admin/research/indicators",
                title: "مؤشرات الباحثين",
                desc: "الفجوات ومن يحتاج متابعة",
                icon: AlertTriangle,
              },
              {
                href: "/admin/research/evaluation",
                title: "التقييم",
                desc: "تجميع التقييم السنوي",
                icon: LineChart,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3.5 transition-colors hover:border-slate-200 hover:bg-white"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
