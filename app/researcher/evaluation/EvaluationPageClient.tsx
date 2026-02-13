"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Toast } from "@/components/ui/toast";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { EmptyChartState } from "@/app/researcher/dashboard/_components/EmptyChartState";
import {
  Award,
  Target,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  FileDown,
} from "lucide-react";
import { getEvaluationData } from "./actions";
import {
  computeOverallScore,
  CATEGORY_LABELS,
  INTERNATIONAL_STANDARDS,
  EVALUATION_WEIGHTS,
  EVALUATION_CAPS,
} from "./types";
import { achievementPercentSingle, buildEvaluationSuggestions } from "@/lib/evaluationSuggestions";
import type { EvaluationAggregates } from "./types";
import type { GoalsInput } from "@/lib/researcherGoalsRepo";
import type { EvaluationPeriod } from "@/lib/evaluationAggregate";

const MONTHS = [
  { value: "all", label: "كل الأشهر" },
  { value: "1", label: "يناير" },
  { value: "2", label: "فبراير" },
  { value: "3", label: "مارس" },
  { value: "4", label: "أبريل" },
  { value: "5", label: "مايو" },
  { value: "6", label: "يونيو" },
  { value: "7", label: "يوليو" },
  { value: "8", label: "أغسطس" },
  { value: "9", label: "سبتمبر" },
  { value: "10", label: "أكتوبر" },
  { value: "11", label: "نوفمبر" },
  { value: "12", label: "ديسمبر" },
];

function getPerformanceLevel(score: number): { label: string; className: string } {
  if (score >= 90) return { label: "امتياز", className: "bg-green-100 text-green-800 border-green-200" };
  if (score >= 80) return { label: "جيد جداً", className: "bg-blue-100 text-blue-800 border-blue-200" };
  if (score >= 70) return { label: "جيد", className: "bg-slate-100 text-slate-800 border-slate-200" };
  return { label: "يحتاج تحسين", className: "bg-amber-100 text-amber-800 border-amber-200" };
}

function getGradeLetter(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  if (score >= 50) return "E";
  return "F";
}

function getPeerIndicator(score: number): { label: string; className: string } {
  if (score >= 80) return { label: "أعلى من المتوسط", className: "text-green-700" };
  if (score >= 60) return { label: "ضمن المتوسط", className: "text-slate-700" };
  return { label: "أقل من المتوسط", className: "text-amber-700" };
}

function getExecutiveSummaryTone(score: number): string {
  if (score >= 85) return "أعلى من المستوى المطلوب حاليًا مع أداء ثابت.";
  if (score >= 70) return "ضمن المستوى المقبول حاليًا لكنه يحتاج رفع الوتيرة.";
  if (score >= 55) return "أقل من المستوى المطلوب حاليًا ويحتاج تحسينًا واضحًا.";
  return "دون المستوى المطلوب حاليًا ويتطلب خطة رفع عاجلة.";
}

/** لون شريط التقدم حسب النسبة */
function progressBarColor(pct: number): string {
  if (pct < 50) return "bg-red-500";
  if (pct < 80) return "bg-amber-500";
  return "bg-green-500";
}

function getPrimaryReason(aggregates: EvaluationAggregates): string {
  const entries = (Object.keys(CATEGORY_LABELS) as (keyof EvaluationAggregates)[])
    .map((key) => {
      const cap = EVALUATION_CAPS[key];
      if (cap <= 0) return null;
      const value = aggregates[key] ?? 0;
      const ratio = Math.min(1, value / cap);
      return { key, ratio, value, cap };
    })
    .filter(Boolean) as Array<{ key: keyof EvaluationAggregates; ratio: number; value: number; cap: number }>;

  if (entries.length === 0) return "لا توجد بيانات كافية لتحديد سبب رئيسي.";
  const lowest = entries.sort((a, b) => a.ratio - b.ratio)[0];
  return `أقل إنجاز في «${CATEGORY_LABELS[lowest.key]}» (${lowest.value} من ${lowest.cap}).`;
}

interface EvaluationPageClientProps {
  initialAggregates: EvaluationAggregates;
  initialGoals: GoalsInput | null;
  initialAvailableYears: number[];
  initialPeriod: EvaluationPeriod | null;
  initialPreviousAggregates: EvaluationAggregates | null;
}

export function EvaluationPageClient({
  initialAggregates,
  initialGoals,
  initialAvailableYears,
  initialPeriod,
  initialPreviousAggregates,
}: EvaluationPageClientProps) {
  const [aggregates, setAggregates] = useState(initialAggregates);
  const [goals, setGoals] = useState<GoalsInput | null>(initialGoals);
  const [availableYears, setAvailableYears] = useState(initialAvailableYears);
  const [period, setPeriod] = useState<EvaluationPeriod | null>(initialPeriod);
  const [previousAggregates, setPreviousAggregates] = useState<EvaluationAggregates | null>(
    initialPreviousAggregates
  );
  const [filterMode, setFilterMode] = useState<"overall" | "period">(
    initialPeriod ? "period" : "overall"
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    initialPeriod?.year?.toString() ?? ""
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialPeriod?.month?.toString() ?? "all"
  );
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [exportScope, setExportScope] = useState<"current" | "overall">("current");

  const loadData = (newPeriod: EvaluationPeriod | null) => {
    startTransition(async () => {
      const result = await getEvaluationData(newPeriod ?? undefined);
      if ("error" in result) {
        setToast({ message: result.error, type: "error" });
        return;
      }
      setAggregates(result.aggregates);
      setGoals(result.goals);
      setAvailableYears(result.availableYears);
      setPeriod(result.period);
      setPreviousAggregates(result.previousAggregates ?? null);
    });
  };

  const handleApplyFilter = () => {
    if (filterMode === "overall") {
      loadData(null);
      return;
    }
    const year = selectedYear ? parseInt(selectedYear, 10) : undefined;
    const month = selectedMonth && selectedMonth !== "all" ? parseInt(selectedMonth, 10) : undefined;
    if (year == null) {
      setToast({ message: "اختر السنة", type: "error" });
      return;
    }
    loadData({ year, month });
  };

  const totalScore = computeOverallScore(aggregates);
  const previousScore = previousAggregates != null ? computeOverallScore(previousAggregates) : null;
  const scoreDelta = previousScore != null ? totalScore - previousScore : null;
  const categories = (Object.keys(CATEGORY_LABELS) as (keyof EvaluationAggregates)[]).filter(
    (k) => k in aggregates
  );

  const goalsKeysWithTarget = goals != null
    ? categories.filter((key) => ((goals as Record<string, number>)[key] ?? 0) > 0)
    : [];
  const achievementPercent =
    goalsKeysWithTarget.length > 0
      ? Math.round(
          goalsKeysWithTarget.reduce((sum, key) => {
            const g = (goals as Record<string, number>)[key] ?? 0;
            const a = aggregates[key] ?? 0;
            return sum + (achievementPercentSingle(a, g) ?? 0);
          }, 0) / goalsKeysWithTarget.length
        )
      : null;

  const categoriesMet =
    goals != null
      ? categories.filter((key) => {
          const g = (goals as Record<string, number>)[key] ?? 0;
          const a = aggregates[key] ?? 0;
          if (g <= 0) return false;
          return (achievementPercentSingle(a, g) ?? 0) >= 100;
        }).length
      : 0;

  const standardsCheck = [
    {
      label: INTERNATIONAL_STANDARDS.research.label,
      met: (aggregates.research ?? 0) >= INTERNATIONAL_STANDARDS.research.min,
      value: aggregates.research ?? 0,
    },
    {
      label: INTERNATIONAL_STANDARDS.conferences.label,
      met: (aggregates.conferences ?? 0) >= INTERNATIONAL_STANDARDS.conferences.min,
      value: aggregates.conferences ?? 0,
    },
    {
      label: INTERNATIONAL_STANDARDS.supervision.label,
      met: (aggregates.supervision ?? 0) >= INTERNATIONAL_STANDARDS.supervision.min,
      value: aggregates.supervision ?? 0,
    },
  ];
  const internationalPercent =
    standardsCheck.length > 0
      ? Math.round(
          (standardsCheck.filter((s) => s.met).length / standardsCheck.length) * 100
        )
      : 0;

  const periodLabel =
    period == null
      ? "الإجمالي (كل البيانات)"
      : period.month != null
        ? `${period.year} – ${MONTHS.find((m) => m.value === String(period.month))?.label ?? period.month}`
        : `${period.year}`;
  const printYear = period?.year ?? new Date().getFullYear();
  const printMonth = period?.month ?? undefined;

  const chartData = categories
    .map((key) => ({
      name: CATEGORY_LABELS[key],
      value: aggregates[key] ?? 0,
      color:
        key === "research"
          ? "#2563EB"
          : key === "conferences"
            ? "#10b981"
            : key === "supervision"
              ? "#f59e0b"
              : "#8b5cf6",
    }))
    .filter((d) => d.value > 0);

  const barChartData = categories.map((key) => ({
    name: CATEGORY_LABELS[key],
    "عدد النشاطات": aggregates[key] ?? 0,
  }));

  const goalVsAchievedData =
    goals != null
      ? categories
          .filter((key) => ((goals as Record<string, number>)[key] ?? 0) > 0)
          .map((key) => ({
            name: CATEGORY_LABELS[key],
            "المنجز": aggregates[key] ?? 0,
            "الهدف": (goals as Record<string, number>)[key] ?? 0,
          }))
      : [];

  const performanceLevel = getPerformanceLevel(totalScore);
  const gradeLetter = getGradeLetter(totalScore);
  const peerIndicator = getPeerIndicator(totalScore);
  const executiveSummaryTone = getExecutiveSummaryTone(totalScore);
  const suggestions = buildEvaluationSuggestions({ aggregates, goals, totalScore });

  const tableRows = categories.map((key) => {
    const achieved = aggregates[key] ?? 0;
    const goal = (goals as Record<string, number> | null)?.[key] ?? null;
    const cap = EVALUATION_CAPS[key];
    const weight = EVALUATION_WEIGHTS[key];
    const ratio = cap > 0 ? Math.min(1, achieved / cap) : 0;
    const weightImpact = Math.round(ratio * weight);
    const pct = achievementPercentSingle(achieved, goal ?? 0);
    const below70 = pct != null && pct < 70;
    return {
      key,
      achieved,
      goal,
      pct,
      weightImpact,
      weight,
      below70,
    };
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto" dir="rtl">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-2xl font-semibold text-gray-900">التقييم والنقاط</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            تقييم إجمالي أو لفترة محددة، ومقارنة مع أهداف الخطة العلمية والمعايير الدولية.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={exportScope}
            onValueChange={(v) => setExportScope(v as "current" | "overall")}
          >
            <SelectTrigger className="h-9 w-[180px] border-slate-200 text-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">تصدير الفترة المعروضة</SelectItem>
              <SelectItem value="overall">تصدير الإجمالي (كل البيانات)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
            onClick={() => {
              const url = `/researcher/evaluation/print?year=${printYear}${
                printMonth ? `&month=${printMonth}` : ""
              }`;
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            <FileDown className="h-4 w-4 ml-2" />
            تصدير PDF
          </Button>
        </div>
      </div>

      {/* ملخص تنفيذي */}
      <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-sm text-slate-700">
        <p className="font-medium text-slate-800 mb-1">ملخص تنفيذي</p>
        <p>
          التقييم الحالي <strong>{totalScore}</strong> من 100 (مستوى <strong>{performanceLevel.label}</strong>) —{" "}
          <strong>{executiveSummaryTone}</strong>
        </p>
        {previousScore != null && scoreDelta != null && (
          <p className="mt-2 pt-2 border-t border-slate-200 text-slate-700 font-medium">
            مقارنة بالفترة السابقة: كان <strong>{previousScore}</strong>، التغيير{" "}
            <span className={scoreDelta >= 0 ? "text-green-700" : "text-red-700"}>
              {scoreDelta >= 0 ? "+" : ""}{scoreDelta}
            </span>{" "}
            نقطة.
          </p>
        )}
      </div>

      {/* فلترة فترة التقييم */}
      <Card className="border-slate-100 bg-white shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            فلترة فترة التقييم
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-500 cursor-help"
              title="اختر «الإجمالي» لعرض كل البيانات، أو «فترة محددة» ثم السنة (والشهر اختياري) ثم اضغط تطبيق لتحديث كل الكروت والرسوم."
            >
              <Info className="h-3 w-3" />
            </span>
          </CardTitle>
          <p className="text-sm text-slate-500">
            عند تغيير الفلترة واضغط «تطبيق» يتم تحديث جميع الكروت والرسوم تلقائياً.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant={filterMode === "overall" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMode("overall")}
                className={filterMode === "overall" ? "bg-[#2563EB] hover:bg-[#1D4ED8]" : ""}
              >
                الإجمالي (كل البيانات)
              </Button>
              <Button
                variant={filterMode === "period" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMode("period")}
                className={filterMode === "period" ? "bg-[#2563EB] hover:bg-[#1D4ED8]" : ""}
              >
                فترة محددة
              </Button>
            </div>
            {filterMode === "period" && (
              <>
                <div className="min-w-[120px]">
                  <label className="block text-sm font-medium text-slate-700 mb-1">السنة</label>
                  <Select
                    value={selectedYear || "__none__"}
                    onValueChange={(v) => setSelectedYear(v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="اختر السنة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">اختر السنة</SelectItem>
                      {availableYears.length > 0
                        ? availableYears.map((y) => (
                            <SelectItem key={y} value={String(y)}>
                              {y}
                            </SelectItem>
                          ))
                        : [new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => (
                            <SelectItem key={y} value={String(y)}>
                              {y}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[140px]">
                  <label className="block text-sm font-medium text-slate-700 mb-1">الشهر</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {filterMode === "period" && !selectedYear && (
              <span className="text-amber-700 text-sm font-medium">اختر السنة أولاً</span>
            )}
            <Button
              onClick={handleApplyFilter}
              disabled={isPending || (filterMode === "period" && !selectedYear)}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "تطبيق"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* إبراز أنواع التقييم */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white shadow-sm">
          <div className="bg-blue-500/10 p-2 rounded-lg">
            <Award className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">التقييم الشامل</p>
            <p className="text-xs text-slate-500">النقاط المرجّحة لكل الفئات حتى 100.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white shadow-sm">
          <div className="bg-emerald-500/10 p-2 rounded-lg">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">المقارنة مع المعايير الدولية</p>
            <p className="text-xs text-slate-500">مطابقة الحدود الدنيا للبحوث والمؤتمرات والإشراف.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white shadow-sm">
          <div className="bg-amber-500/10 p-2 rounded-lg">
            <Target className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">مقارنة أهداف الخطة العلمية</p>
            <p className="text-xs text-slate-500">نسبة الإنجاز بناءً على الأهداف المحددة.</p>
          </div>
        </div>
      </div>

      {/* Hero Card */}
      <Card className="border-slate-100 bg-white shadow-lg border-r-4 border-r-blue-500">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`rounded-full p-4 md:p-6 ${
                  totalScore >= 80
                    ? "bg-green-50"
                    : totalScore >= 60
                      ? "bg-blue-50"
                      : "bg-amber-50"
                }`}
              >
                <span
                  className={`text-3xl md:text-4xl font-black ${
                    totalScore >= 80
                      ? "text-green-600"
                      : totalScore >= 60
                        ? "text-blue-600"
                        : "text-amber-600"
                  }`}
                >
                  {totalScore}
                </span>
                <span className="text-slate-500 text-sm mr-1">/ 100</span>
                <div
                  className="mt-2 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700"
                  title="تصنيف حرفي تقريبي مبني على التقييم من 100."
                >
                  Grade: {gradeLetter}
                  <Info className="h-3 w-3 text-slate-400" />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">التقييم الكلي</p>
                <p className="text-xs text-slate-500 mb-1">
                  مجموع النقاط المرجّحة لجميع الفئات حتى سقف 100.
                </p>
                <Badge className={performanceLevel.className} variant="outline">
                  {performanceLevel.label}
                </Badge>
                {scoreDelta != null && (
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    {scoreDelta >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={scoreDelta >= 0 ? "text-green-700" : "text-red-700"}>
                      {scoreDelta >= 0 ? "+" : ""}
                      {scoreDelta} عن الفترة السابقة
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <span>مؤشر تقريبي بين الزملاء:</span>
                  <span className={`font-medium ${peerIndicator.className}`}>{peerIndicator.label}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:flex md:gap-8">
              <div
                className="p-3 rounded-lg bg-slate-50 border border-slate-100"
                title={
                  achievementPercent == null
                    ? "لم تُحدد أهداف في الخطة العلمية لهذه الفئات، لذلك لا تُحسب نسبة الإنجاز."
                    : undefined
                }
              >
                <p className="text-xs text-slate-500 mb-0.5">مقارنة مع الخطة العلمية</p>
                <p className="text-xl font-bold text-slate-900">
                  {achievementPercent != null ? `${achievementPercent}%` : "غير محدد بالخطة"}
                </p>
              </div>
              <div
                className="p-3 rounded-lg bg-slate-50 border border-slate-100"
                title="المطابقة تعني استيفاء الحد الأدنى لكل معيار دولي (بحوث، مؤتمرات، إشراف)."
              >
                <p className="text-xs text-slate-500 mb-0.5">
                  {internationalPercent === 100 ? "مستوفٍ للمعايير الدولية" : "مقارنة مع المعايير الدولية"}
                </p>
                <p className="text-xl font-bold text-slate-900">{internationalPercent}%</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500">
            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-700">النقاط:</strong> مجموع مساهمات كل فئة (مرجّحة بسقف لكل فئة حتى 100).
              <strong className="text-slate-700 mr-1"> التقييم الكلي:</strong> نفس القيمة معبّر عنها من 100 مع مستوى أداء (امتياز / جيد جداً / جيد / يحتاج تحسين).
            </span>
          </div>
        </CardContent>
      </Card>

      {/* نسبة الإنجاز من أهداف الخطة */}
      <Card className="border-slate-100 bg-white shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-600" />
            نسبة الإنجاز من أهداف الخطة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="text-3xl font-black text-slate-900">
              {achievementPercent != null ? `${achievementPercent}%` : "--"}
            </div>
            <div className="text-sm text-slate-600">
              {achievementPercent != null
                ? "تعكس نسبة الإنجاز متوسط التقدم مقابل الأهداف المحددة."
                : "لا توجد أهداف محددة في الخطة العلمية لهذه الفترة، لذا لا يمكن احتساب نسبة الإنجاز."}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border border-slate-100 border-r-4 border-r-blue-500 bg-white shadow-lg min-h-[92px]">
          <CardContent className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="bg-blue-500/10 p-2 rounded-lg flex-shrink-0">
                <Award className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-xl md:text-2xl font-black text-gray-900">{totalScore}</div>
            </div>
            <p className="text-xs text-slate-500 leading-tight">النقاط الإجمالية (من 100)</p>
          </CardContent>
        </Card>
        <Card
          className="border border-slate-100 border-r-4 border-r-emerald-500 bg-white shadow-lg min-h-[92px]"
          title={
            achievementPercent == null
              ? "لم تُحدد أهداف في الخطة العلمية، لذلك لا تُحسب نسبة الإنجاز."
              : undefined
          }
        >
          <CardContent className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="bg-emerald-500/10 p-2 rounded-lg flex-shrink-0">
                <Target className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-xl md:text-2xl font-black text-gray-900">
                {achievementPercent != null ? `${achievementPercent}%` : "غير محدد بالخطة"}
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-tight">نسبة الإنجاز من الأهداف</p>
          </CardContent>
        </Card>
        <Card
          className="border border-slate-100 border-r-4 border-r-purple-500 bg-white shadow-lg min-h-[92px]"
          title={
            goals == null
              ? "لم تُحدد أهداف في الخطة العلمية، لذلك لا يُحسب عدد الفئات المحققة."
              : undefined
          }
        >
          <CardContent className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="bg-purple-500/10 p-2 rounded-lg flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-xl md:text-2xl font-black text-gray-900">
                {goals != null ? `${categoriesMet} / ${categories.length}` : "غير محدد بالخطة"}
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-tight">الفئات المحققة</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 border-r-4 border-r-amber-500 bg-white shadow-lg min-h-[92px]">
          <CardContent className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="bg-amber-500/10 p-2 rounded-lg flex-shrink-0">
                <Calendar className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-sm font-bold text-gray-900 truncate max-w-[120px]">
                {periodLabel}
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-tight">الفترة المعروضة</p>
          </CardContent>
        </Card>
      </div>

      {/* 1) توزيع النشاط (Pie) */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">توزيع النشاط</h3>
        <div className="grid grid-cols-12 gap-4">
          <Card className="border border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-4">
            <CardContent className="pt-4 pb-4 px-4">
              <h4 className="text-base font-semibold text-gray-900 mb-3">توزيع النشاط (دائري)</h4>
              <div className="h-[300px]">
                {chartData.length > 0 ? (
                  <PieChart
                    data={chartData}
                    tooltipLabel={(name, value) => `${name}: ${value}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    outerRadius={80}
                    innerRadius={28}
                    legendWrapperStyle={{ fontSize: "11px" }}
                  />
                ) : (
                  <EmptyChartState type="pie" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-100 bg-white shadow-lg col-span-12 lg:col-span-8">
            <CardContent className="pt-4 pb-4 px-4">
              <h4 className="text-base font-semibold text-gray-900 mb-3">توزيع النشاط حسب الفئة</h4>
              <div className="h-[300px]">
                {barChartData.some((d) => d["عدد النشاطات"] > 0) ? (
                  <BarChart
                    data={barChartData}
                    dataKeys={["عدد النشاطات"]}
                    colors={["#2563EB"]}
                    tooltipLabel={(name, count) => `${name}: ${count}`}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tickFontSize={11}
                  />
                ) : (
                  <EmptyChartState type="bar" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        {goalVsAchievedData.length > 0 && (
          <Card className="border border-slate-100 bg-white shadow-lg mt-4">
            <CardContent className="pt-4 pb-4 px-4">
              <h4 className="text-base font-semibold text-gray-900 mb-3">الإنجاز مقابل الهدف</h4>
              <div className="h-[280px]">
                <BarChart
                  data={goalVsAchievedData}
                  dataKeys={["المنجز", "الهدف"]}
                  colors={["#10b981", "#f59e0b"]}
                  tooltipLabel={(name, value) => `${name}: ${value}`}
                  legendLayout="horizontal"
                  legendVerticalAlign="bottom"
                  tickFontSize={11}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* جدول تفصيل الإنجاز/الوزن */}
      <Card className="border-slate-100 bg-white shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">تفصيل الفئات (المنجز، الهدف، نسبة الإنجاز، تأثير الوزن)</CardTitle>
        </CardHeader>
        <CardContent>
          {tableRows.every((r) => r.pct == null) && (
            <p className="text-sm text-slate-600 mb-3">
              حدّث أهداف الخطة العلمية لرؤية نسبة الإنجاز وشريط التقدم لكل فئة.
            </p>
          )}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-right font-medium text-slate-600">الفئة</TableHead>
                  <TableHead className="text-right font-medium text-slate-600">المنجز</TableHead>
                  <TableHead className="text-right font-medium text-slate-600">الهدف</TableHead>
                  <TableHead className="text-right font-medium text-slate-600">نسبة الإنجاز</TableHead>
                  <TableHead className="text-right font-medium text-slate-600">الوزن</TableHead>
                  <TableHead className="text-right font-medium text-slate-600">تأثير الوزن</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((row) => (
                  <TableRow
                    key={row.key}
                    className={
                      row.below70
                        ? "hover:bg-slate-50/50 bg-amber-50/50"
                        : "hover:bg-slate-50/50"
                    }
                  >
                    <TableCell className="font-medium text-slate-900">
                      {CATEGORY_LABELS[row.key]}
                    </TableCell>
                    <TableCell>{row.achieved}</TableCell>
                    <TableCell>{row.goal != null ? row.goal : "غير محدد بالخطة"}</TableCell>
                    <TableCell
                      title={
                        row.pct == null
                          ? "لم يُحدد هدف لهذه الفئة في الخطة العلمية، لذلك لا تُحسب نسبة الإنجاز."
                          : undefined
                      }
                    >
                      {row.pct != null ? (
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden min-w-[48px]">
                            <div
                              className={`h-full rounded-full ${progressBarColor(row.pct)}`}
                              style={{ width: `${Math.min(100, row.pct)}%` }}
                            />
                          </div>
                          <span
                            className={`text-sm font-medium shrink-0 ${
                              row.pct < 50
                                ? "text-red-700"
                                : row.pct < 80
                                  ? "text-amber-700"
                                  : "text-green-700"
                            }`}
                          >
                            {row.pct}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">غير محدد بالخطة</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500">{row.weight}</TableCell>
                    <TableCell className="text-slate-700 font-medium">{row.weightImpact}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* مقارنة المعايير الدولية */}
      <Card className="border-slate-100 bg-white shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#2563EB]" />
            مقارنة مع المعايير الدولية
            {internationalPercent === 100 && (
              <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                مستوفٍ
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {standardsCheck.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50"
              >
                <span className="text-sm text-slate-700" dir="rtl">
                  {s.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{s.value}</span>
                  {s.met ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-amber-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
