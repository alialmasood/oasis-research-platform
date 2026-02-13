"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { AnalyticsConferences } from "@/lib/analytics/analyticsTypes";
import { SectionCard } from "./SectionCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Inbox } from "lucide-react";

type ChartsConferencesProps = {
  data: AnalyticsConferences;
};

const pieColors = ["#2563EB", "#10b981", "#f59e0b"];

export function ChartsConferences({ data }: ChartsConferencesProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="rounded-2xl border border-slate-100 bg-white shadow-lg h-[280px]" />;
  }

  return (
    <SectionCard title="تحليل المؤتمرات والمشاركات" description="عدد المؤتمرات سنويًا وتصنيفها ونوع المشاركة">
      {data.yearly.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
          <div className="rounded-full bg-slate-100 p-4 text-slate-500">
            <Inbox className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">لم يتم تسجيل مشاركات في هذه الفترة.</p>
            <p className="text-xs text-slate-500 mt-1">ابدأ بإضافة مؤتمر جديد لتظهر البيانات هنا.</p>
          </div>
          <Button asChild className="mt-1">
            <Link href="/researcher/activities/conferences">إضافة مؤتمر</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={220}>
              <BarChart data={data.yearly} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.15} />
                <XAxis dataKey="year" tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-4">
            <div className="h-[140px]">
              {data.scopeShares.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={120}>
                  <PieChart>
                    <Pie data={data.scopeShares} dataKey="value" nameKey="name" innerRadius={35} outerRadius={55}>
                      {data.scopeShares.map((entry, index) => (
                        <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-slate-500">لا يتوفر تصنيف محلي/دولي.</div>
              )}
            </div>
            <div className="h-[140px]">
              {data.participationShares.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={120}>
                  <PieChart>
                    <Pie
                      data={data.participationShares}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={35}
                      outerRadius={55}
                    >
                      {data.participationShares.map((entry, index) => (
                        <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-slate-500">لا تتوفر أنواع المشاركة.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
