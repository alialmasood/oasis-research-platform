"use client";

import { Trophy, Award, Medal } from "lucide-react";

interface RankingStatsProps {
  universityRank: number;
  collegeRank: number;
  departmentRank: number;
}

export function RankingStats({
  universityRank,
  collegeRank,
  departmentRank,
}: RankingStatsProps) {
  const rankings = [
    {
      label: "ترتيبك في الجامعة",
      value: universityRank,
      icon: Trophy,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "ترتيبك في الكلية",
      value: collegeRank,
      icon: Award,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "ترتيبك في القسم",
      value: departmentRank,
      icon: Medal,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {rankings.map((ranking) => {
        const Icon = ranking.icon;
        return (
          <div
            key={ranking.label}
            className={`flex items-center gap-2.5 ${ranking.bgColor} px-3.5 py-2 rounded-xl hover:shadow-sm transition-shadow`}
          >
            <div className={`${ranking.color} flex-shrink-0`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-slate-600 leading-tight whitespace-nowrap">
                {ranking.label}
              </span>
              <span className={`text-base font-bold ${ranking.color} leading-tight`}>
                #{ranking.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
