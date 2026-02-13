"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart } from "@/components/charts/bar-chart";
import type { MetricTabData } from "@/lib/comparisonRepo";

type MetricTabsProps = {
  metricTabs: MetricTabData[];
  defaultTabId?: string;
};

export function MetricTabs({ metricTabs, defaultTabId }: MetricTabsProps) {
  const defaultTab = defaultTabId ?? metricTabs[0]?.id ?? "total";

  return (
    <Card className="border-slate-100 bg-white shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">تفاصيل المؤشرات</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-4 flex flex-wrap">
            {metricTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {metricTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">ترتيبك في هذا المعيار: {tab.myRank}</p>
                <p className="text-xs text-slate-500">أفضل 10 على مستوى الجامعة</p>
              </div>

              <div className="grid gap-3">
                {tab.top10.map((entry, index) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {index + 1}. {entry.fullName}
                      </p>
                      <p className="text-xs text-slate-500">{entry.departmentName}</p>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{entry.metricValue}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-100 p-3">
                <div className="text-sm font-semibold text-slate-900 mb-2">مقارنة سريعة (أعلى 5 + أنت)</div>
                <div style={{ height: "220px" }}>
                  <BarChart
                    data={tab.chartData.map((row) => ({
                      name: row.name,
                      القيمة: row.isUser ? 0 : row.value,
                      أنت: row.isUser ? row.value : 0,
                    }))}
                    dataKeys={["القيمة", "أنت"]}
                    colors={["#94a3b8", "#2563EB"]}
                    legendLayout="horizontal"
                    legendVerticalAlign="bottom"
                    tooltipLabel={(label, value, dataKey) =>
                      `القيمة لـ ${label}: ${value} ${dataKey === "أنت" ? "(أنت)" : ""}`
                    }
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
