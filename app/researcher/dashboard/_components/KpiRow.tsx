"use client";

import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Award, Calendar, Activity } from "lucide-react";

interface KpiRowProps {
  currentScore: number;
  previousScore?: number;
  topIndexing: string;
  topActivity: string;
  lastUpdate?: string;
}

export function KpiRow({
  currentScore,
  previousScore = 70,
  topIndexing,
  topActivity,
  lastUpdate = "منذ يومين",
}: KpiRowProps) {
  const scoreChange = currentScore - previousScore;
  const isImproving = scoreChange >= 0;

  return (
    <>
      {/* موبايل: بطاقات أجمل بشبكة 2×2 */}
      <div className="grid grid-cols-2 gap-2 md:hidden">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-3 shadow-sm">
          <div className="absolute -left-3 -top-3 h-14 w-14 rounded-full bg-emerald-200/30" aria-hidden />
          <div className="relative flex items-center gap-2 mb-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
              {isImproving ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
            </span>
            <span className="text-[10px] font-medium text-emerald-800/90">نقاطي الحالية</span>
          </div>
          <div className="relative flex items-end gap-1 flex-wrap">
            <span className="text-xl font-black tabular-nums text-emerald-900 leading-none">
              {currentScore.toFixed(1)}
            </span>
            <span className="text-[10px] text-emerald-600/80 pb-0.5">/100</span>
            {scoreChange !== 0 && (
              <Badge
                className={`h-5 px-1.5 text-[10px] font-semibold shrink-0 ${
                  isImproving
                    ? "bg-emerald-500 text-white border-0"
                    : "bg-red-500 text-white border-0"
                }`}
              >
                {isImproving ? "+" : ""}
                {scoreChange.toFixed(1)}
              </Badge>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-blue-50 p-3 shadow-sm">
          <div className="absolute -left-3 -top-3 h-14 w-14 rounded-full bg-sky-200/30" aria-hidden />
          <div className="relative flex items-center gap-2 mb-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm">
              <Award className="h-3.5 w-3.5" />
            </span>
            <span className="text-[10px] font-medium text-sky-800/90">أقوى تصنيف</span>
          </div>
          <div className="relative">
            <span className="inline-flex max-w-full items-center rounded-lg bg-sky-500/10 px-2 py-1 text-[11px] font-bold text-sky-800 border border-sky-200/80 truncate">
              {topIndexing}
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-3 shadow-sm">
          <div className="absolute -left-3 -top-3 h-14 w-14 rounded-full bg-violet-200/30" aria-hidden />
          <div className="relative flex items-center gap-2 mb-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-500 text-white shadow-sm">
              <Activity className="h-3.5 w-3.5" />
            </span>
            <span className="text-[10px] font-medium text-violet-800/90">أكثر نشاط</span>
          </div>
          <div className="relative">
            <span className="inline-flex max-w-full items-center rounded-lg bg-violet-500/10 px-2 py-1 text-[11px] font-bold text-violet-800 border border-violet-200/80 truncate">
              {topActivity}
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-3 shadow-sm">
          <div className="absolute -left-3 -top-3 h-14 w-14 rounded-full bg-amber-200/30" aria-hidden />
          <div className="relative flex items-center gap-2 mb-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <Calendar className="h-3.5 w-3.5" />
            </span>
            <span className="text-[10px] font-medium text-amber-800/90">آخر تحديث</span>
          </div>
          <div className="relative">
            <span className="text-sm font-bold text-amber-900/90 truncate block leading-snug">
              {lastUpdate}
            </span>
          </div>
        </div>
      </div>

      {/* حاسوب: التخطيط السابق كما هو */}
      <div className="hidden md:flex md:items-center md:gap-2 md:flex-wrap">
        <div className="min-w-0 overflow-hidden bg-white rounded-md border border-slate-200 shadow-sm p-2.5 h-9 flex items-center gap-1.5">
          {isImproving ? (
            <TrendingUp className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 flex-shrink-0 text-red-600" />
          )}
          <span className="text-xs font-medium text-slate-600 whitespace-nowrap">نقاطي الحالية</span>
          <span className="text-base font-semibold text-gray-900 tabular-nums">{currentScore.toFixed(1)}</span>
          <span className="text-xs text-slate-400">/100</span>
          {scoreChange !== 0 && (
            <Badge
              className={`h-4 px-1 text-[10px] shrink-0 ${
                isImproving
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {isImproving ? "+" : ""}
              {scoreChange.toFixed(1)}
            </Badge>
          )}
        </div>

        <div className="min-w-0 overflow-hidden bg-white rounded-md border border-slate-200 shadow-sm p-2.5 h-9 flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
          <span className="text-xs font-medium text-slate-600 whitespace-nowrap">أقوى تصنيف</span>
          <Badge className="h-4 max-w-full px-1.5 text-[10px] bg-blue-50 text-blue-700 border-blue-200 truncate inline-flex">
            {topIndexing}
          </Badge>
        </div>

        <div className="min-w-0 overflow-hidden bg-white rounded-md border border-slate-200 shadow-sm p-2.5 h-9 flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 flex-shrink-0 text-purple-600" />
          <span className="text-xs font-medium text-slate-600 whitespace-nowrap">أكثر نشاط</span>
          <Badge className="h-4 max-w-full px-1.5 text-[10px] bg-purple-50 text-purple-700 border-purple-200 truncate inline-flex">
            {topActivity}
          </Badge>
        </div>

        <div className="min-w-0 overflow-hidden bg-white rounded-md border border-slate-200 shadow-sm p-2.5 h-9 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
          <span className="text-xs font-medium text-slate-600 whitespace-nowrap">آخر تحديث</span>
          <span className="text-xs text-slate-500 truncate">{lastUpdate}</span>
        </div>
      </div>
    </>
  );
}
