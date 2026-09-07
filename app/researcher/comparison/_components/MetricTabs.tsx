"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart } from "@/components/charts/bar-chart";
import type { MetricTabData } from "@/lib/comparisonRepo";

type MetricTabsProps = {
  metricTabs: MetricTabData[];
  defaultTabId?: string;
  currentUserId?: string;
};

export function MetricTabs({ metricTabs, defaultTabId, currentUserId }: MetricTabsProps) {
  const defaultTab = defaultTabId ?? metricTabs[0]?.id ?? "total";

  if (metricTabs.length === 0) {
    return (
      <Card className="border-slate-100 bg-white shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">تفاصيل المؤشرات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-h-[120px] flex items-center justify-center text-sm text-slate-500">
            لا توجد مؤشرات متاحة حالياً.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100 bg-white shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">تفاصيل المؤشرات</CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          اختر معيارًا لترى ترتيبك فيه، وأفضل 10 في الجامعة، ومقارنة سريعة مع الأعلى أداءً.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab} className="gap-4">
          <TabsList className="h-auto w-full flex flex-wrap justify-start gap-1 rounded-xl bg-slate-100 p-1">
            {metricTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-lg px-3 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {metricTabs.map((tab) => {
            const inTop10 = tab.top10.some((entry) => entry.id === currentUserId);
            return (
              <TabsContent key={tab.id} value={tab.id} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">ترتيبك في «{tab.label}»</p>
                      <p className="text-2xl font-bold tabular-nums text-slate-900 mt-1">#{tab.myRank}</p>
                    </div>
                    {!inTop10 ? (
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600">
                        خارج أفضل 10
                      </span>
                    ) : (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                        ضمن أفضل 10
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                    <p className="text-xs text-slate-500">قيمتك في هذا المعيار</p>
                    <p className="text-2xl font-bold tabular-nums text-slate-900 mt-1">{tab.myValue}</p>
                    <p className="text-[11px] text-slate-500 mt-1">نقاط حسب وزن المعيار المختار</p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">أفضل 10 في الجامعة</p>
                      <span className="text-[11px] text-slate-500">حسب «{tab.label}»</span>
                    </div>
                    {tab.top10.length === 0 ? (
                      <div className="min-h-[160px] flex items-center justify-center text-sm text-slate-500">
                        لا توجد بيانات كافية.
                      </div>
                    ) : (
                      <ol className="space-y-2">
                        {tab.top10.map((entry, index) => {
                          const isCurrent = entry.id === currentUserId;
                          return (
                            <li
                              key={entry.id}
                              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                                isCurrent
                                  ? "border-blue-200 bg-blue-50/70"
                                  : "border-slate-100 bg-slate-50/50"
                              }`}
                            >
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700">
                                {index + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {entry.fullName}
                                  {isCurrent ? (
                                    <span className="mr-1 text-[11px] font-medium text-blue-700">(أنت)</span>
                                  ) : null}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">{entry.departmentName}</p>
                              </div>
                              <div className="text-left shrink-0">
                                <p className="text-sm font-bold tabular-nums text-slate-900">{entry.metricValue}</p>
                                <p className="text-[10px] text-slate-500">نقطة</p>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">مقارنة سريعة</p>
                      <p className="text-xs text-slate-500 mt-0.5">أعلى 5 في المعيار مقارنةً بك</p>
                    </div>
                    <div className="h-[280px]">
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
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
