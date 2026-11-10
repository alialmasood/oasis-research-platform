"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, ArrowRight } from "lucide-react";

interface EvaluationCardProps {
  score: number;
  suggestions: string[];
}

export function EvaluationCard({ score, suggestions }: EvaluationCardProps) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-blue-600";
    return "text-orange-600";
  };

  const getScoreBg = (value: number) => {
    if (value >= 80) return "bg-green-50";
    if (value >= 60) return "bg-blue-50";
    return "bg-orange-50";
  };

  const getScoreRing = (value: number) => {
    if (value >= 80) return "ring-green-200";
    if (value >= 60) return "ring-blue-200";
    return "ring-orange-200";
  };

  const getScoreBar = (value: number) => {
    if (value >= 80) return "bg-green-500";
    if (value >= 60) return "bg-blue-500";
    return "bg-orange-500";
  };

  return (
    <Card className="border-0 md:border md:border-slate-100 bg-transparent md:bg-white shadow-none md:shadow-lg p-0 md:p-6 overflow-hidden rounded-none md:rounded-xl">
      <CardHeader className="pb-2 px-0 pt-0">
        <CardTitle className="text-sm md:text-base font-semibold text-gray-900 flex items-center gap-2">
          <span className="md:hidden flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
            <Award className="h-3.5 w-3.5 text-[#2563EB]" />
          </span>
          <Award className="hidden md:block h-5 w-5 text-[#2563EB] shrink-0" />
          التقييم
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-0 space-y-3 md:space-y-4">
        {/* موبايل: بطاقة تقييم مميزة */}
        <div className="md:hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-3 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`${getScoreBg(score)} ${getScoreRing(score)} ring-4 rounded-2xl h-[4.5rem] w-[4.5rem] flex flex-col items-center justify-center shrink-0`}
            >
              <div className={`text-3xl font-black tabular-nums leading-none ${getScoreColor(score)}`}>
                {score}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">/ 100</div>
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-xs font-semibold text-slate-800">مستوى تقييمك الحالي</p>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${getScoreBar(score)} transition-all`}
                  style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                ركّز على النقاط أدناه لرفع تقييمك.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-2.5">
            <h3 className="text-xs font-semibold text-gray-900 mb-2">ما ينقصني؟</h3>
            <ul className="space-y-1.5 mb-3">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed rounded-lg bg-slate-50 px-2 py-1.5"
                >
                  <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 shrink-0">
                    {index + 1}
                  </span>
                  <span className="min-w-0 break-words">{suggestion}</span>
                </li>
              ))}
            </ul>
            <Link href="/researcher/evaluation" className="block">
              <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-9 px-4 text-xs w-full">
                عرض تفاصيل التقييم
                <ArrowRight className="h-4 w-4 mr-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* حاسوب: التخطيط السابق */}
        <div className="hidden md:flex md:flex-row md:items-center md:gap-6">
          <div className="flex-shrink-0">
            <div
              className={`${getScoreBg(score)} rounded-full p-6 relative flex flex-col items-center justify-center`}
            >
              <div className={`text-4xl font-black tabular-nums ${getScoreColor(score)}`}>
                {score}
              </div>
              <div className="text-xs text-gray-500 absolute bottom-1 left-1/2 -translate-x-1/2">
                / 100
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">ما ينقصني؟</h3>
            <ul className="space-y-1.5 mb-4">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                  <span className="text-[#2563EB] mt-0.5 shrink-0">•</span>
                  <span className="min-w-0 break-words">{suggestion}</span>
                </li>
              ))}
            </ul>
            <Link href="/researcher/evaluation" className="inline-block">
              <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-8 px-4 text-sm">
                عرض تفاصيل التقييم
                <ArrowRight className="h-4 w-4 mr-2" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
