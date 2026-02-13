"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import type { AnalyticsComparison } from "@/lib/analytics/analyticsTypes";
import { SectionCard } from "./SectionCard";

type ComparisonPanelProps = {
  compare?: AnalyticsComparison;
};

export function ComparisonPanel({ compare }: ComparisonPanelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!compare) return null;
  if (!mounted) {
    return <div className="rounded-2xl border border-slate-100 bg-white shadow-lg h-[280px]" />;
  }

  const merged = compare.timeline.current.map((point, index) => ({
    label: point.label,
    current: point.total,
    previous: compare.timeline.previous[index]?.total ?? 0,
  }));
  const sum = (list: typeof compare.timeline.current, key: keyof (typeof compare.timeline.current)[number]) =>
    list.reduce((acc, item) => acc + (item[key] as number), 0);
  const totalsData = [
    {
      label: "إجمالي النشاط",
      current: sum(compare.timeline.current, "total"),
      previous: sum(compare.timeline.previous, "total"),
    },
    {
      label: "البحوث",
      current: sum(compare.timeline.current, "research"),
      previous: sum(compare.timeline.previous, "research"),
    },
    {
      label: "المؤتمرات",
      current: sum(compare.timeline.current, "conference"),
      previous: sum(compare.timeline.previous, "conference"),
    },
    {
      label: "الورش",
      current: sum(compare.timeline.current, "workshop"),
      previous: sum(compare.timeline.previous, "workshop"),
    },
    {
      label: "اللجان",
      current: sum(compare.timeline.current, "committee"),
      previous: sum(compare.timeline.previous, "committee"),
    },
  ];

  return (
    <SectionCard title="مقارنة الفترات" description="الفرق بين الفترة الحالية والسابقة">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
          إجمالي النشاط: {compare.delta.total}%
        </div>
        <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
          البحوث: {compare.delta.research}%
        </div>
        <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
          المؤتمرات: {compare.delta.conference}%
        </div>
        <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
          الورش: {compare.delta.workshop}%
        </div>
        <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
          اللجان: {compare.delta.committee}%
        </div>
      </div>
      <div className="grid gap-4 mt-4 lg:grid-cols-[2fr_1fr]">
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <LineChart data={merged} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.15} />
              <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              />
              <Line type="monotone" dataKey="current" stroke="#2563EB" strokeWidth={2} dot />
              <Line type="monotone" dataKey="previous" stroke="#94a3b8" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <BarChart data={totalsData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.15} />
              <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 11 }} interval={0} />
              <YAxis allowDecimals={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              />
              <Legend />
              <Bar dataKey="current" name="الفترة الحالية" fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="previous" name="الفترة السابقة" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SectionCard>
  );
}
