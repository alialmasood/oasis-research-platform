"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  CheckCircle2,
  Loader2,
  FileEdit,
  FileX,
  Database,
  Globe,
  MapPin,
  User,
  Percent,
  Users,
  ClipboardList,
  ClipboardX,
} from "lucide-react";
import type { AdminResearchStats } from "@/lib/admin/researchTypes";
import { formatNumber } from "@/lib/utils";

const cards: Array<{
  key: keyof AdminResearchStats;
  label: string;
  icon: typeof BookOpen;
  border: string;
  iconBg: string;
  iconColor: string;
  suffix?: string;
}> = [
  { key: "total", label: "إجمالي البحوث", icon: BookOpen, border: "border-r-blue-600", iconBg: "bg-blue-600/10", iconColor: "text-blue-600" },
  { key: "planned", label: "مخططة", icon: ClipboardList, border: "border-r-indigo-600", iconBg: "bg-indigo-600/10", iconColor: "text-indigo-600" },
  { key: "unplanned", label: "غير مخططة", icon: ClipboardX, border: "border-r-slate-500", iconBg: "bg-slate-500/10", iconColor: "text-slate-600" },
  { key: "completed", label: "منجزة", icon: CheckCircle2, border: "border-r-emerald-600", iconBg: "bg-emerald-600/10", iconColor: "text-emerald-600" },
  { key: "inProgress", label: "غير منجزة", icon: Loader2, border: "border-r-amber-600", iconBg: "bg-amber-600/10", iconColor: "text-amber-600" },
  { key: "published", label: "منشورة", icon: FileEdit, border: "border-r-purple-600", iconBg: "bg-purple-600/10", iconColor: "text-purple-600" },
  { key: "unpublished", label: "غير منشورة", icon: FileX, border: "border-r-rose-600", iconBg: "bg-rose-600/10", iconColor: "text-rose-600" },
  { key: "international", label: "عالمية", icon: Globe, border: "border-r-sky-600", iconBg: "bg-sky-600/10", iconColor: "text-sky-600" },
  { key: "local", label: "محلية", icon: MapPin, border: "border-r-orange-600", iconBg: "bg-orange-600/10", iconColor: "text-orange-600" },
  { key: "individual", label: "فردية", icon: User, border: "border-r-violet-600", iconBg: "bg-violet-600/10", iconColor: "text-violet-600" },
  { key: "scopus", label: "سكوبس", icon: Database, border: "border-r-cyan-600", iconBg: "bg-cyan-600/10", iconColor: "text-cyan-600" },
  { key: "isi", label: "ISI / Thomson", icon: Database, border: "border-r-teal-600", iconBg: "bg-teal-600/10", iconColor: "text-teal-600" },
  { key: "researchersWithResearch", label: "باحثون نشطون", icon: Users, border: "border-r-blue-800", iconBg: "bg-blue-800/10", iconColor: "text-blue-800" },
  { key: "avgProgressInProgress", label: "متوسط التقدّم", icon: Percent, border: "border-r-slate-600", iconBg: "bg-slate-600/10", iconColor: "text-slate-600", suffix: "%" },
];

interface ResearchStatsCardsProps {
  stats: AdminResearchStats;
  hiddenKeys?: Array<keyof AdminResearchStats>;
}

export const INTERNATIONAL_STATS_HIDDEN: Array<keyof AdminResearchStats> = [
  "avgProgressInProgress",
  "unpublished",
  "inProgress",
  "local",
];

export function ResearchStatsCards({ stats, hiddenKeys = [] }: ResearchStatsCardsProps) {
  const hidden = new Set(hiddenKeys);
  const visibleCards = cards.filter(({ key }) => !hidden.has(key));
  const gridCols =
    visibleCards.length <= 5
      ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5"
      : visibleCards.length <= 10
        ? "grid-cols-2 sm:grid-cols-4 xl:grid-cols-5"
        : "grid-cols-2 sm:grid-cols-4 xl:grid-cols-7";

  return (
    <div className={`grid gap-3 ${gridCols}`}>
        {visibleCards.map(({ key, label, icon: Icon, border, iconBg, iconColor, suffix }) => (
          <Card
            key={key}
            className={`border border-slate-100 bg-white shadow-lg border-r-4 min-h-[92px] ${border}`}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-1">
                <div className={`p-1.5 rounded-lg ${iconBg}`}>
                  <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                </div>
                <span className="text-lg font-bold text-slate-900 leading-none tabular-nums" dir="ltr">
                  {formatNumber(stats[key])}
                  {suffix ?? ""}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-tight">{label}</p>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
