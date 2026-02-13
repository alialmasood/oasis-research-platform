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
  LineChart,
  Line,
} from "recharts";
import type { AnalyticsPublications } from "@/lib/analytics/analyticsTypes";
import { SectionCard } from "./SectionCard";

type ChartsPublicationsProps = {
  data: AnalyticsPublications;
};

const pieColors = ["#2563EB", "#10b981"];

export function ChartsPublications({ data }: ChartsPublicationsProps) {
  const [mounted, setMounted] = useState(false);
  const topVenue = data.topVenues[0]?.name ?? "—";
  const localShare = data.scopeShares
    .filter((item) => item.name === "محلي")
    .reduce((sum, item) => sum + item.value, 0);
  const internationalShare = data.scopeShares
    .filter((item) => item.name !== "محلي")
    .reduce((sum, item) => sum + item.value, 0);
  const totalShare = localShare + internationalShare;
  const localPct = totalShare > 0 ? Math.round((localShare / totalShare) * 100) : 0;
  const internationalPct = totalShare > 0 ? Math.round((internationalShare / totalShare) * 100) : 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="rounded-2xl border border-slate-100 bg-white shadow-lg h-[280px]" />;
  }

  return (
    <SectionCard title="تحليل النشر العلمي" description="النشر عبر السنوات والجهات والتصنيف">
      {data.yearly.length === 0 ? (
        <div className="text-sm text-slate-500">لم يتم تسجيل مشاركات في هذه الفترة.</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            نسبة النشر المحلي/العالمي: {localPct}% محلي — {internationalPct}% عالمي · أفضل جهة نشر: {topVenue}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
              متوسط النشر بالسنة: {data.averagePerYear}
            </div>
            <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
              سنوات الذروة: {data.peakYears.length > 0 ? data.peakYears.join("، ") : "—"}
            </div>
            <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
              التصنيف: {data.scopeShares.map((s) => `${s.name}: ${s.value}`).join(" — ") || "—"}
            </div>
          </div>

          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <LineChart data={data.yearly} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
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
                <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <BarChart data={data.topVenues} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "8px 12px",
                    }}
                  />
                  <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-[240px]">
              {data.scopeShares.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <PieChart>
                    <Pie
                      data={data.scopeShares}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={70}
                    >
                      {data.scopeShares.map((entry, index) => (
                        <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-slate-500">لا يتوفر تصنيف محلي/إقليمي/عالمي.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
