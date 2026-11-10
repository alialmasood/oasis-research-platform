"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ActivityTrends } from "@/lib/comparisonRepo";

type ActivityTrendsCardProps = {
  trends: ActivityTrends;
};

const monthLabels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export function ActivityTrendsCard({ trends }: ActivityTrendsCardProps) {
  const [mounted, setMounted] = useState(false);
  const [metricView, setMetricView] = useState<"total" | "research" | "conferences" | "courses">("total");

  useEffect(() => {
    setMounted(true);
  }, []);

  const yearlyData = useMemo(
    () =>
      trends.yearly.map((entry) => ({
        name: String(entry.year),
        النقاط: entry.points,
        research: entry.research,
        conferences: entry.conferences,
        courses: entry.courses,
        isCurrent: entry.isCurrent,
      })),
    [trends.yearly]
  );

  const monthlyData = useMemo(
    () =>
      trends.monthly.map((entry) => ({
        name: monthLabels[entry.month - 1],
        النقاط: entry.isBest ? 0 : entry.points,
        "الأعلى": entry.isBest ? entry.points : 0,
        research: entry.research,
        conferences: entry.conferences,
        courses: entry.courses,
      })),
    [trends.monthly]
  );

  if (!mounted) {
    return (
      <>
        <div className="md:hidden rounded-xl border border-slate-100 bg-white shadow-sm h-[220px]" />
        <div className="hidden md:block rounded-2xl border border-slate-100 bg-white shadow-lg h-[340px]" />
      </>
    );
  }

  const bestMonthLabel = trends.bestMonth ? `أعلى شهر نشاطًا: ${trends.bestMonth}` : "أعلى شهر نشاطًا: —";
  const yearlyMetricKey =
    metricView === "total"
      ? "النقاط"
      : metricView === "research"
        ? "research"
        : metricView === "conferences"
          ? "conferences"
          : "courses";

  const metricDefs = [
    { id: "total" as const, label: "إجمالي النقاط", short: "الإجمالي" },
    { id: "research" as const, label: "البحث", short: "البحث" },
    { id: "conferences" as const, label: "المؤتمرات", short: "مؤتمرات" },
    { id: "courses" as const, label: "الدورات", short: "دورات" },
  ] as const;

  const metricButtons = (
    <>
      <div className="md:hidden flex items-center gap-1 flex-nowrap overflow-x-auto min-w-0">
        {metricDefs.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={metricView === item.id ? "default" : "outline"}
            onClick={() => setMetricView(item.id)}
            className="h-8 px-1.5 text-[10px] shrink-0"
          >
            {item.short}
          </Button>
        ))}
      </div>
      <div className="hidden md:flex flex-wrap items-center gap-2">
        {metricDefs.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={metricView === item.id ? "default" : "outline"}
            onClick={() => setMetricView(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </>
  );

  const chartBlock = (kind: "yearly" | "monthly") => (
    <div className="h-[160px] md:h-[240px]">
      <ResponsiveContainer width="100%" height="100%" minHeight={140}>
        {kind === "yearly" ? (
          <LineChart data={yearlyData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.15} />
            <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
            />
            <Line
              type="monotone"
              dataKey={yearlyMetricKey}
              stroke="#2563EB"
              strokeWidth={3}
              dot={(props: any) => {
                const isCurrent = props.payload?.isCurrent;
                return (
                  <g>
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={isCurrent ? 7 : 4}
                      fill={isCurrent ? "#f59e0b" : "#2563EB"}
                      stroke="white"
                      strokeWidth={2}
                    />
                    {isCurrent ? (
                      <text
                        x={(props.cx ?? 0) + 8}
                        y={(props.cy ?? 0) - 8}
                        fontSize="11"
                        fill="#f59e0b"
                      >
                        السنة الحالية
                      </text>
                    ) : null}
                  </g>
                );
              }}
            />
          </LineChart>
        ) : (
          <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.15} />
            <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              formatter={(value, name, props) => {
                if (name !== "النقاط" && name !== "الأعلى") return value;
                const payload = props.payload as any;
                return [
                  value,
                  `النقاط (بحث: ${payload?.research ?? 0}، مؤتمرات: ${payload?.conferences ?? 0}، دورات: ${payload?.courses ?? 0})`,
                ];
              }}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
            />
            <Bar dataKey="النقاط" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="الأعلى" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );

  return (
    <Card className="border-slate-100 bg-white shadow-sm md:shadow-lg">
      <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
        <CardTitle className="text-sm md:text-base font-semibold text-slate-900">
          تحليل نشاطك الأكاديمي
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
        <Tabs defaultValue="yearly">
          <TabsList className="mb-3 md:mb-4 w-full md:w-auto h-auto md:h-9 flex flex-nowrap gap-1 md:gap-0 rounded-xl md:rounded-lg bg-slate-100 p-1 overflow-x-auto">
            <TabsTrigger value="yearly" className="text-[10px] md:text-sm px-2 md:px-3 py-1.5 md:py-1 flex-1 md:flex-none shrink-0">
              <span className="md:hidden">عبر السنوات</span>
              <span className="hidden md:inline">تطوّر النشاط عبر السنوات</span>
            </TabsTrigger>
            <TabsTrigger value="monthly" className="text-[10px] md:text-sm px-2 md:px-3 py-1.5 md:py-1 flex-1 md:flex-none shrink-0">
              <span className="md:hidden">نشاط الأشهر</span>
              <span className="hidden md:inline">نشاط الأشهر في السنة الحالية</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="yearly" className="space-y-2 md:space-y-3">
            <p className="hidden md:block text-sm text-slate-600">تطوّر نشاطك الأكاديمي عبر السنوات</p>
            {metricButtons}
            {chartBlock("yearly")}
          </TabsContent>

          <TabsContent value="monthly" className="space-y-2 md:space-y-3">
            <p className="hidden md:block text-sm text-slate-600">نشاطك خلال أشهر السنة الحالية</p>
            {chartBlock("monthly")}
            <p className="text-[10px] md:text-xs text-slate-500">{bestMonthLabel}</p>
            <p className="hidden md:block text-xs text-slate-500">
              ركّز على تكرار نشاطاتك في الأشهر الأقل أداءً لضبط التقدم الشهري.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
