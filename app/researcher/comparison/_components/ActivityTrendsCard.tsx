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
    return <div className="rounded-2xl border border-slate-100 bg-white shadow-lg h-[340px]" />;
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

  return (
    <Card className="border-slate-100 bg-white shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">تحليل نشاطك الأكاديمي</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="yearly">
          <TabsList className="mb-4">
            <TabsTrigger value="yearly">تطوّر النشاط عبر السنوات</TabsTrigger>
            <TabsTrigger value="monthly">نشاط الأشهر في السنة الحالية</TabsTrigger>
          </TabsList>

          <TabsContent value="yearly" className="space-y-3">
            <p className="text-sm text-slate-600">تطوّر نشاطك الأكاديمي عبر السنوات</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={metricView === "total" ? "default" : "outline"}
                onClick={() => setMetricView("total")}
              >
                إجمالي النقاط
              </Button>
              <Button
                type="button"
                size="sm"
                variant={metricView === "research" ? "default" : "outline"}
                onClick={() => setMetricView("research")}
              >
                البحث
              </Button>
              <Button
                type="button"
                size="sm"
                variant={metricView === "conferences" ? "default" : "outline"}
                onClick={() => setMetricView("conferences")}
              >
                المؤتمرات
              </Button>
              <Button
                type="button"
                size="sm"
                variant={metricView === "courses" ? "default" : "outline"}
                onClick={() => setMetricView("courses")}
              >
                الدورات
              </Button>
            </div>
            <div style={{ height: "240px" }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
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
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-3">
            <p className="text-sm text-slate-600">نشاطك خلال أشهر السنة الحالية</p>
            <div style={{ height: "240px" }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
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
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500">{bestMonthLabel}</p>
            <p className="text-xs text-slate-500">
              ركّز على تكرار نشاطاتك في الأشهر الأقل أداءً لضبط التقدم الشهري.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
