"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Database, Users } from "lucide-react";
import type { ResearchStats } from "@/lib/research/researchStats";
import type { AdminResearchStats } from "@/lib/admin/researchTypes";
import { formatNumber } from "@/lib/utils";

interface ResearchScopusStatsCardsProps {
  stats: AdminResearchStats;
  chartStats: ResearchStats;
}

const quartileCards = [
  { key: "Q1" as const, label: "Q1", border: "border-r-emerald-600", iconBg: "bg-emerald-600/10", iconColor: "text-emerald-600" },
  { key: "Q2" as const, label: "Q2", border: "border-r-teal-600", iconBg: "bg-teal-600/10", iconColor: "text-teal-600" },
  { key: "Q3" as const, label: "Q3", border: "border-r-cyan-600", iconBg: "bg-cyan-600/10", iconColor: "text-cyan-600" },
  { key: "Q4" as const, label: "Q4", border: "border-r-sky-600", iconBg: "bg-sky-600/10", iconColor: "text-sky-600" },
];

type StatCard = {
  label: string;
  value: number;
  icon: typeof Database;
  border: string;
  iconBg: string;
  iconColor: string;
};

function StatCardItem({ label, value, icon: Icon, border, iconBg, iconColor }: StatCard) {
  return (
    <Card
      className={`border border-slate-100 bg-white shadow-lg border-r-4 min-h-[88px] min-w-0 ${border}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-1">
          <div className={`p-1.5 rounded-lg shrink-0 ${iconBg}`}>
            <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
          </div>
          <span className="text-lg font-bold text-slate-900 leading-none tabular-nums" dir="ltr">
            {formatNumber(value)}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 leading-tight">{label}</p>
      </CardContent>
    </Card>
  );
}

export function ResearchScopusStatsCards({ stats, chartStats }: ResearchScopusStatsCardsProps) {
  const q = chartStats.scopusQuartiles;

  const summaryCards: StatCard[] = [
    { label: "إجمالي سكوبس", value: stats.total, icon: Database, border: "border-r-blue-600", iconBg: "bg-blue-600/10", iconColor: "text-blue-600" },
    { label: "باحثون", value: stats.researchersWithResearch, icon: Users, border: "border-r-indigo-600", iconBg: "bg-indigo-600/10", iconColor: "text-indigo-600" },
  ];

  const quartileStatCards: StatCard[] = quartileCards.map(({ key, label, border, iconBg, iconColor }) => ({
    label,
    value: q[key],
    icon: Database,
    border,
    iconBg,
    iconColor,
  }));

  const allCards = [...summaryCards, ...quartileStatCards];

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-700">ملخص بحوث SCOPUS</h2>

      <div className="grid grid-cols-6 gap-3">
        {allCards.map((card) => (
          <StatCardItem key={card.label} {...card} />
        ))}
      </div>
    </div>
  );
}
