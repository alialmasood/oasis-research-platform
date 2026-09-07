"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  BookOpen,
  Quote,
  AlertTriangle,
  Link as LinkIcon,
} from "lucide-react";
import type { ExternalProfileMetrics } from "@/lib/research/externalProfileMetrics";

type ApiResponse = {
  researcher: { id: string; name: string | null };
  metrics: ExternalProfileMetrics;
};

const cardShell =
  "rounded-xl border border-slate-200/70 bg-white shadow-sm";

function parsePublicationTitle(title: string) {
  const retractedPattern = /^\s*\[?\s*RETRACTED\s*\]?\s*[:\-–—]?\s*/i;
  const retracted = retractedPattern.test(title) || /\bRETRACTED\b/i.test(title);
  const displayTitle = title.replace(retractedPattern, "").replace(/\bRETRACTED\b/gi, "").trim() || title;
  return { retracted, displayTitle };
}

function MetricTile({
  label,
  value,
  hint,
  tone = "slate",
}: {
  label: string;
  value: string | number | null | undefined;
  hint?: string;
  tone?: "slate" | "blue" | "emerald" | "amber";
}) {
  const dots = {
    slate: "bg-slate-400",
    blue: "bg-blue-400",
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
  };

  return (
    <div className={`h-full ${cardShell} px-3.5 py-3`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-500 leading-none" dir="ltr">
          {label}
        </p>
        <span className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${dots[tone]}`} />
      </div>
      <p className="mt-1.5 text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight text-slate-900 leading-none">
        {value == null || value === "" ? "—" : value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-[11px] text-slate-400 leading-snug" dir="auto">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function ResearchDataClient() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/researcher/external-metrics", { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "تعذر جلب المؤشرات");
      }
      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const metrics = data?.metrics;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">
            البيانات البحثية
          </h1>
          <p className="text-[13px] text-slate-500 leading-relaxed max-w-2xl">
            مؤشراتك الخارجية مثل H-Index والمنشورات والاستشهادات، مع التحقق من تطابق الهوية قبل العرض.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            onClick={() => load(true)}
            disabled={loading || refreshing}
            className="h-9 rounded-lg px-3.5 text-sm bg-blue-600 hover:bg-blue-700"
          >
            {refreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin ml-2" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 ml-2" />
            )}
            تحديث الاستخراج
          </Button>
          <Button asChild variant="outline" className="h-9 rounded-lg px-3.5 text-sm border-slate-200">
            <Link href="/researcher/links">
              <LinkIcon className="h-3.5 w-3.5 ml-2" />
              روابط الباحث
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center text-slate-500 gap-2 text-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          جاري تحليل الروابط واستخراج المؤشرات...
        </div>
      ) : null}

      {error ? (
        <Card className={`${cardShell} border-rose-200/80 bg-rose-50/40 gap-0 py-0`}>
          <CardContent className="px-5 py-3.5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-800 text-sm">تعذر تحميل البيانات البحثية</p>
              <p className="text-sm text-rose-700 mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!loading && metrics ? (
        <>
          <Card className={`${cardShell} overflow-hidden gap-0 py-0`}>
            <CardHeader className="px-5 py-3 border-b border-slate-100 gap-0 space-y-0 [.border-b]:pb-3">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-0.5">
                  <CardTitle className="text-[15px] font-semibold text-slate-900 leading-snug">
                    نتيجة الاستخراج
                  </CardTitle>
                  <p className="text-xs text-slate-500 leading-snug">{metrics.message}</p>
                </div>
                <div
                  className={`inline-flex items-center sm:self-center rounded-md border px-2 py-0.5 text-[11px] font-medium shrink-0 ${
                    metrics.identityMatch === "matched"
                      ? "border-emerald-100 bg-emerald-50/80 text-emerald-700"
                      : metrics.identityMatch === "mismatch"
                        ? "border-rose-100 bg-rose-50/80 text-rose-700"
                        : "border-amber-100 bg-amber-50/80 text-amber-700"
                  }`}
                >
                  {metrics.identityMatch === "matched"
                    ? "الهوية متطابقة"
                    : metrics.identityMatch === "mismatch"
                      ? "هوية غير متطابقة"
                      : metrics.identityMatch === "uncertain"
                        ? "مطابقة بحذر"
                        : "الهوية غير متاحة"}
                  {metrics.matchScore != null ? `: ${metrics.matchScore}%` : ""}
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-5 py-4 space-y-3">
              <div className="rounded-xl border border-slate-200/60 bg-slate-50/40 px-3.5 py-2.5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:items-start">
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500 leading-none">اسمك على المنصة</p>
                    <p className="mt-1 text-sm font-medium text-slate-800 leading-snug truncate" dir="auto">
                      {metrics.platformName || data?.researcher.name || "—"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500 leading-none">الاسم في المصدر الخارجي</p>
                    <p className="mt-1 text-sm font-medium text-slate-800 leading-snug truncate" dir="auto">
                      {metrics.displayName || "—"}
                    </p>
                  </div>
                  <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                    <p className="text-[11px] text-slate-500 leading-none">
                      <span dir="ltr">ORCID</span>
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800 leading-snug break-all" dir="ltr">
                      {metrics.orcid || "غير متوفر"}
                    </p>
                  </div>
                </div>
              </div>

              {metrics.identityMatch === "mismatch" ? (
                <div className="rounded-xl border border-rose-200/80 bg-rose-50/60 px-3.5 py-2.5 text-sm text-rose-900">
                  رُفضت النتيجة لحماية دقة البيانات: المصدر يشير إلى اسم مختلف عن ملفك
                  (مثل إضافة لقب عائلي غير موجود). راجع ORCID أو الاسم الإنجليزي في الملف الشخصي.
                </div>
              ) : null}

              {metrics.ok ? (
                <>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricTile
                      label="H-Index"
                      value={metrics.hIndex}
                      tone="blue"
                      hint="OpenAlex / Semantic Scholar"
                    />
                    <MetricTile
                      label="Publications"
                      value={metrics.publications}
                      tone="emerald"
                      hint="عدد الأعمال المفهرسة"
                    />
                    <MetricTile
                      label="Citations"
                      value={metrics.citedByCount}
                      tone="amber"
                      hint="إجمالي الاستشهادات"
                    />
                    <MetricTile
                      label="i10-Index"
                      value={metrics.i10Index}
                      tone="slate"
                      hint="أعمال باستشهاد ≥ 10"
                    />
                  </div>

                  <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200/60 bg-slate-50/30 px-3.5 py-2">
                    <p className="text-sm text-slate-500">متوسط الاستشهادات لسنتين</p>
                    <p className="text-sm font-semibold tabular-nums text-slate-800">
                      {metrics.twoYearMeanCitedness ?? "—"}
                    </p>
                  </div>
                </>
              ) : null}

              {!metrics.ok ? (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-3.5 py-2.5 text-sm text-amber-900">
                  {metrics.message}{" "}
                  <Link href="/researcher/links" className="underline font-medium">
                    راجع الروابط هنا
                  </Link>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {metrics.ok ? (
            <Card className={`${cardShell} overflow-hidden gap-0 py-0`}>
              <CardHeader className="px-5 py-3 border-b border-slate-100 gap-0 space-y-0 [.border-b]:pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-[15px] font-semibold text-slate-900 flex items-center gap-2 leading-snug">
                    <BookOpen className="h-4 w-4 text-slate-500 shrink-0" />
                    أحدث المنشورات المستخرجة
                  </CardTitle>
                  <span className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 tabular-nums">
                    {metrics.recentWorks.length.toLocaleString("ar-IQ")} منشور
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-5 py-2.5">
                {metrics.recentWorks.length === 0 ? (
                  <p className="text-sm text-slate-500 py-2">لا توجد منشورات مستخرجة حالياً.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {metrics.recentWorks.map((work, index) => {
                      const { retracted, displayTitle } = parsePublicationTitle(work.title);
                      return (
                        <li key={`${work.title}-${index}`} className="py-2.5 first:pt-1.5 last:pb-1.5">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
                                {retracted ? (
                                  <span className="inline-flex items-center rounded-md border border-rose-100 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-rose-700 shrink-0 leading-none">
                                    مسحوب
                                  </span>
                                ) : null}
                                <p className="text-sm font-medium text-slate-900 leading-snug min-w-0 break-words" dir="auto">
                                  {work.openAlexUrl ? (
                                    <a
                                      href={work.openAlexUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-blue-700 hover:underline underline-offset-2"
                                    >
                                      {displayTitle}
                                    </a>
                                  ) : (
                                    displayTitle
                                  )}
                                </p>
                              </div>
                              <p className="mt-1 text-xs text-slate-500 leading-snug break-words" dir="ltr">
                                <span>{work.year ?? "—"}</span>
                                {work.doi ? (
                                  <>
                                    <span className="mx-1.5 text-slate-300">•</span>
                                    <span className="text-slate-500">DOI: </span>
                                    <a
                                      href={`https://doi.org/${work.doi}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600/80 hover:text-blue-700 hover:underline underline-offset-2 break-all"
                                    >
                                      {work.doi}
                                    </a>
                                  </>
                                ) : null}
                              </p>
                            </div>
                            <div className="w-[76px] shrink-0 flex justify-end pt-0.5">
                              <span
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200/80 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-slate-600"
                                title="عدد الاستشهادات"
                                aria-label={`عدد الاستشهادات: ${work.citedByCount}`}
                              >
                                <Quote className="h-3 w-3 text-slate-400" aria-hidden />
                                <span>{work.citedByCount}</span>
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
