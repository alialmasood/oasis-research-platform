"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, TrendingUp, ArrowRight } from "lucide-react";

interface EvaluationCardProps {
  score: number;
  suggestions: string[];
}

export function EvaluationCard({ score, suggestions }: EvaluationCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    return "text-orange-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-50";
    if (score >= 60) return "bg-blue-50";
    return "bg-orange-50";
  };

  return (
    <Card className="border-slate-100 bg-white shadow-lg p-3 md:p-6">
      <CardHeader className="pb-2 px-0 pt-0">
        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Award className="h-5 w-5 text-[#2563EB]" />
          التقييم
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-0 space-y-3 md:space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-6">
          <div className="flex-shrink-0">
            <div className={`${getScoreBg(score)} rounded-full p-3 md:p-6 relative`}>
              <div className={`text-4xl font-black ${getScoreColor(score)}`}>
                {score}
              </div>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-gray-500">
                / 100
              </div>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">ما ينقصني؟</h3>
            <ul className="space-y-1 mb-3 md:mb-4">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-[#2563EB] mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
            <Link href="/researcher/evaluation">
              <Button
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white h-8 px-4 text-sm"
              >
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
