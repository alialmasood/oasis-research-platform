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

  const cardClass = "flex items-center gap-1.5 p-1.5 md:p-2.5 bg-white rounded-md border border-slate-200 shadow-sm h-9";
  const iconClass = "h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0";
  const labelClass = "text-[10px] md:text-xs font-medium text-slate-600 whitespace-nowrap";
  const valueClass = "text-sm md:text-base font-semibold text-gray-900";

  return (
    <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
      {/* نقاطي الحالية */}
      <div className={cardClass}>
        {isImproving ? (
          <TrendingUp className={`${iconClass} text-green-600`} />
        ) : (
          <TrendingDown className={`${iconClass} text-red-600`} />
        )}
        <span className={labelClass}>نقاطي الحالية</span>
        <span className={valueClass}>{currentScore.toFixed(1)}</span>
        <span className="text-[10px] md:text-xs text-slate-400">/100</span>
        {scoreChange !== 0 && (
          <Badge
            className={`h-4 px-1 text-[10px] ${
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

      {/* أقوى تصنيف */}
      <div className={cardClass}>
        <Award className={`${iconClass} text-blue-600`} />
        <span className={labelClass}>أقوى تصنيف</span>
        <Badge className="h-4 px-1.5 text-[10px] bg-blue-50 text-blue-700 border-blue-200">
          {topIndexing}
        </Badge>
      </div>

      {/* أكثر نشاط */}
      <div className={cardClass}>
        <Activity className={`${iconClass} text-purple-600`} />
        <span className={labelClass}>أكثر نشاط</span>
        <Badge className="h-4 px-1.5 text-[10px] bg-purple-50 text-purple-700 border-purple-200">
          {topActivity}
        </Badge>
      </div>

      {/* آخر تحديث */}
      <div className={cardClass}>
        <Calendar className={`${iconClass} text-slate-500`} />
        <span className={labelClass}>آخر تحديث</span>
        <span className="text-[10px] md:text-xs text-slate-500">{lastUpdate}</span>
      </div>
    </div>
  );
}
