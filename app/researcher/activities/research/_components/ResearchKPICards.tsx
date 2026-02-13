"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  CheckCircle2,
  Loader2,
  FileEdit,
  Database,
  Percent,
} from "lucide-react";
import type { ResearchStats } from "@/lib/research/researchStats";

const kpis: Array<{
  key: keyof ResearchStats["totals"];
  label: string;
  icon: typeof BookOpen;
  color: string;
  format?: (v: number) => string;
}> = [
  { key: "total", label: "إجمالي البحوث", icon: BookOpen, color: "bg-blue-500" },
  { key: "completed", label: "منجز", icon: CheckCircle2, color: "bg-green-500" },
  { key: "inProgress", label: "غير منجز", icon: Loader2, color: "bg-amber-500" },
  { key: "published", label: "منشور", icon: FileEdit, color: "bg-purple-500" },
  { key: "scopus", label: "سكوبس", icon: Database, color: "bg-cyan-500" },
  {
    key: "avgProgressInProgress",
    label: "متوسط التقدّم % (غير منجز)",
    icon: Percent,
    color: "bg-slate-600",
    format: (v) => `${v}%`,
  },
];

export function ResearchKPICards({ stats }: { stats: ResearchStats }) {
  return (
    <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {kpis.map(({ key, label, icon: Icon, color, format }) => {
        const value = format ? format(stats.totals[key]) : String(stats.totals[key]);
        return (
          <Card
            key={key}
            className="border-slate-100 bg-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <CardContent className="p-2.5 sm:p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className={`${color} p-1.5 rounded-lg flex-shrink-0`}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="text-lg sm:text-xl font-black text-gray-900 truncate min-w-0">{value}</div>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-tight line-clamp-2">{label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
