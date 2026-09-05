"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/charts/bar-chart";
import { EmptyChartState } from "@/app/researcher/dashboard/_components/EmptyChartState";
import type { ResearchStats } from "@/lib/research/researchStats";

const PUBLISH_TYPE_LABELS: Record<string, string> = {
  journal: "مجلة",
  conference: "مؤتمر",
  bookChapter: "فصل كتاب",
  report: "تقرير",
  other: "أخرى",
};

const COUNT_KEY = "عدد البحوث";

export function ResearchScopusChartsSection({ stats }: { stats: ResearchStats }) {
  const toInt = (n: number) => Math.round(Number(n));

  const quartileData = [
    { name: "Q1", [COUNT_KEY]: toInt(stats.scopusQuartiles.Q1), color: "#059669" },
    { name: "Q2", [COUNT_KEY]: toInt(stats.scopusQuartiles.Q2), color: "#0d9488" },
    { name: "Q3", [COUNT_KEY]: toInt(stats.scopusQuartiles.Q3), color: "#0891b2" },
    { name: "Q4", [COUNT_KEY]: toInt(stats.scopusQuartiles.Q4), color: "#06b6d4" },
  ];

  const byYearData = stats.byYear.map(({ year, count }) => ({
    name: String(year),
    [COUNT_KEY]: toInt(count),
  }));

  const publishTypeData = Object.entries(stats.byPublishType)
    .filter(([_, count]) => count > 0)
    .map(([k, v]) => ({
      name: PUBLISH_TYPE_LABELS[k] ?? k,
      [COUNT_KEY]: toInt(v),
    }));

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-700">تحليلات SCOPUS</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="توزيع الأرباع (Q1–Q4)">
          <BarChart
            data={quartileData}
            dataKeys={[COUNT_KEY]}
            colors={["#059669", "#0d9488", "#0891b2", "#06b6d4"]}
          />
        </ChartCard>

        <ChartCard title="حسب السنة">
          {byYearData.length > 0 ? (
            <BarChart data={byYearData} dataKeys={[COUNT_KEY]} colors={["#2563EB"]} />
          ) : (
            <EmptyChartState type="bar" />
          )}
        </ChartCard>

        <ChartCard title="نوع النشر">
          {publishTypeData.length > 0 ? (
            <BarChart
              data={publishTypeData}
              dataKeys={[COUNT_KEY]}
              colors={["#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]}
            />
          ) : (
            <EmptyChartState type="bar" />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="border-slate-100 bg-white shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: "220px" }}>{children}</div>
      </CardContent>
    </Card>
  );
}
