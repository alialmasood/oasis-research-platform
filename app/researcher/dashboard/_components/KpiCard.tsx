"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

export function KpiCard({ label, value, icon: Icon, color }: KpiCardProps) {
  return (
    <Card className="border-slate-100 bg-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className={`${color} p-1.5 rounded-lg`}>
            <Icon className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        <div className="text-xl font-black text-gray-900 mb-0.5">{value}</div>
        <p className="text-xs text-slate-500 leading-tight">{label}</p>
      </CardContent>
    </Card>
  );
}
