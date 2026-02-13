"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { AnalyticsTimelinePoint } from "@/lib/analytics/analyticsTypes";
import { SectionCard } from "./SectionCard";

type ChartsOverviewProps = {
  timeline: AnalyticsTimelinePoint[];
};

export function ChartsOverview({ timeline }: ChartsOverviewProps) {
  const [mounted, setMounted] = useState(false);
  const average = useMemo(() => {
    if (timeline.length === 0) return 0;
    const total = timeline.reduce((sum, point) => sum + point.total, 0);
    return Math.round(total / timeline.length);
  }, [timeline]);
  const bestKey = useMemo(() => {
    if (timeline.length === 0) return "";
    return timeline.reduce((best, point) => (point.total > best.total ? point : best)).key;
  }, [timeline]);
  const chartData = useMemo(
    () => timeline.map((row) => ({ ...row, average })),
    [timeline, average]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="rounded-2xl border border-slate-100 bg-white shadow-lg h-[280px]" />;
  }

  return (
    <SectionCard title="النشاط الأكاديمي عبر الزمن" description="إجمالي النشاط مع متوسط الأداء وأفضل فترة">
      {timeline.length === 0 ? (
        <div className="text-sm text-slate-500">لا توجد بيانات للفترة المحددة.</div>
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.15} />
              <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const row = payload[0].payload as AnalyticsTimelinePoint;
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
                      <div className="text-sm font-semibold text-slate-900">{row.label}</div>
                      <div className="mt-1">إجمالي النشاط: {row.total}</div>
                      <div>بحوث: {row.research}</div>
                      <div>مؤتمرات: {row.conference}</div>
                      <div>ورش: {row.workshop}</div>
                      <div>لجان: {row.committee}</div>
                    </div>
                  );
                }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              />
              <Area type="monotone" dataKey="activitiesCore" fill="#bfdbfe" stroke="#93c5fd" />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#2563EB"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const isBest = payload?.key === bestKey;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isBest ? 6 : 3}
                      fill={isBest ? "#f59e0b" : "#2563EB"}
                      stroke={isBest ? "#fde68a" : "#2563EB"}
                      strokeWidth={isBest ? 2 : 1}
                    />
                  );
                }}
              />
              <Line type="monotone" dataKey="average" stroke="#10b981" strokeDasharray="4 4" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}
