"use client";

import { BarChart3, TrendingUp, PieChart } from "lucide-react";

interface EmptyChartStateProps {
  type?: "bar" | "line" | "pie";
}

export function EmptyChartState({ type = "bar" }: EmptyChartStateProps) {
  const icons = {
    bar: BarChart3,
    line: TrendingUp,
    pie: PieChart,
  };

  const Icon = icons[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center h-full min-h-[300px]">
      <div className="mb-3 rounded-full bg-slate-100 p-3">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-sm text-slate-500">لا توجد بيانات لعرضها</p>
    </div>
  );
}
